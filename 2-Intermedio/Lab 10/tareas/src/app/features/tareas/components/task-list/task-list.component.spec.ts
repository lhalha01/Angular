import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Task } from '../../models/task.model';
import { ConfirmService } from '@core/services/confirm.service';
import { ToastService } from '@core/services/toast.service';
import { TaskListComponent } from './task-list.component';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';
const USER_LIST = [
  { id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' },
  { id: 2, name: 'Ervin', username: 'e', email: 'e@e.com' },
];

const SMALL: Task[] = [
  { id: 1, userId: 1, title: 'Comprar pan', completed: true, priority: 'medium', createdAt: '2024-01-03T00:00:00Z' },
  { id: 2, userId: 1, title: 'Llamar al médico', completed: false, priority: 'medium', createdAt: '2024-01-02T00:00:00Z' },
  { id: 3, userId: 2, title: 'Estudiar Angular', completed: true, priority: 'medium', createdAt: '2024-01-01T00:00:00Z' },
];

describe('TaskListComponent', () => {
  beforeEach(() => localStorage.removeItem('taskView'));
  afterEach(() => localStorage.removeItem('taskView'));

  function setup(tasks: Task[] = SMALL) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();
    http.expectOne(TODOS).flush(tasks);
    http.expectOne(USERS).flush(USER_LIST);
    fixture.detectChanges();
    return helpers(fixture, http);
  }

  function helpers(fixture: ReturnType<typeof TestBed.createComponent<TaskListComponent>>, http: HttpTestingController) {
    const el = fixture.nativeElement as HTMLElement;
    const ids = () => Array.from(el.querySelectorAll('.meta')).map((m) => m.textContent?.trim().split(' ')[0]);
    const type = (value: string) => {
      const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const selectByLabel = (label: string, optionText: string) => {
      const select = Array.from(el.querySelectorAll<HTMLLabelElement>('label'))
        .find((l) => l.textContent?.trim().startsWith(label))!
        .querySelector('select')!;
      select.selectedIndex = Array.from(select.options).findIndex((o) => o.textContent?.trim() === optionText);
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    /** Teclea y espera la pausa de 300 ms (debounce); responde la búsqueda de la API con `resultados`. */
    const search = (term: string, resultados: Task[]) => {
      type(term);
      tick(300);
      http.expectOne((r) => r.url === TODOS && r.params.get('q') === term.trim()).flush(resultados);
      fixture.detectChanges();
    };
    return { fixture, el, http, ids, type, selectByLabel, search };
  }

  describe('filters', () => {
    it('shows every task by default', () => {
      expect(setup().ids()).toEqual(['#1', '#2', '#3']);
    });

    it('filters by user', () => {
      const { ids, selectByLabel } = setup();
      selectByLabel('Filtrar por usuario', 'Ervin');
      expect(ids()).toEqual(['#3']);
    });

    it('combines user and status filters', () => {
      const { ids, selectByLabel } = setup();
      selectByLabel('Filtrar por usuario', 'Leanne');
      selectByLabel('Filtrar por estado', 'Pendientes');
      expect(ids()).toEqual(['#2']);
    });

    it('filters by priority', () => {
      const { ids, selectByLabel } = setup([
        { ...SMALL[0], priority: 'high' },
        { ...SMALL[1], priority: 'low' },
        { ...SMALL[2], priority: 'high' },
      ]);
      selectByLabel('Filtrar por prioridad', 'Alta');
      expect(ids()).toEqual(['#1', '#3']);
      selectByLabel('Filtrar por prioridad', 'Baja');
      expect(ids()).toEqual(['#2']);
      selectByLabel('Filtrar por prioridad', 'Todas');
      expect(ids().length).toBe(3);
    });

    it('combines priority with the other filters', () => {
      const { ids, selectByLabel } = setup([
        { ...SMALL[0], priority: 'high' }, // completada
        { ...SMALL[1], priority: 'high' }, // pendiente
        { ...SMALL[2], priority: 'low' },
      ]);
      selectByLabel('Filtrar por prioridad', 'Alta');
      selectByLabel('Filtrar por estado', 'Pendientes');
      expect(ids()).toEqual(['#2']);
    });

    it('shows the priority of every task', () => {
      const { el } = setup([{ ...SMALL[0], priority: 'high' }, SMALL[1], { ...SMALL[2], priority: 'low' }]);
      expect(Array.from(el.querySelectorAll('.priority')).map((p) => p.textContent?.trim())).toEqual(['Alta', 'Media', 'Baja']);
    });

    it('searches by title through the API, once the user pauses typing', fakeAsync(() => {
      const { ids, type, http, fixture, search } = setup();
      type('medico');
      tick(299);
      http.expectNone((r) => r.url === TODOS && r.params.has('q')); // aún no ha pasado la pausa
      tick(1);
      http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'medico').flush([SMALL[1]]);
      fixture.detectChanges();
      expect(ids()).toEqual(['#2']);
      search('angular', [SMALL[2]]);
      expect(ids()).toEqual(['#3']);
    }));

    it('typing fast makes a single request, 300 ms after the last key', fakeAsync(() => {
      const { type, http, fixture } = setup();
      for (const text of ['pa', 'pan', 'pan ', 'pan c']) {
        type(text);
        tick(100);
      }
      http.expectNone((r) => r.url === TODOS && r.params.has('q'));
      tick(200);
      http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'pan c').flush([]);
      fixture.detectChanges();
    }));

    it('a search shorter than 2 characters is not a search: the whole list is shown, with no request', fakeAsync(() => {
      const { ids, type, http } = setup();
      type('p');
      tick(400);
      http.expectNone((r) => r.url === TODOS && r.params.has('q'));
      expect(ids()).toEqual(['#1', '#2', '#3']);
    }));

    it('cancels the search in flight when a newer one starts (switchMap) and ignores its late answer', fakeAsync(() => {
      const { ids, type, http, fixture } = setup();
      type('an');
      tick(300);
      const vieja = http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'an');
      type('ang');
      tick(300);
      expect(vieja.cancelled).toBeTrue();
      http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'ang').flush([SMALL[2]]);
      fixture.detectChanges();
      expect(ids()).toEqual(['#3']);
    }));

    it('keeps the previous results while a new search is in flight and says it is searching', fakeAsync(() => {
      const { el, ids, type, http, fixture, search } = setup();
      search('pan', [SMALL[0]]);
      type('pan c');
      tick(300);
      fixture.detectChanges();
      expect(ids()).toEqual(['#1']); // los resultados anteriores siguen visibles
      expect(el.querySelector('.count')?.textContent).toContain('buscando');
      http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'pan c').flush([]);
      fixture.detectChanges();
    }));

    it('shows the in-memory task, not the one in the API answer (the in-memory data rules)', fakeAsync(() => {
      const { ids, fixture, search } = setup();
      search('pan', [{ ...SMALL[0], title: 'Dato viejo del servidor' }]);
      expect(ids()).toEqual(['#1']);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('COMPRAR PAN');
    }));

    it('if the search fails it keeps the list and says so (the error toast comes from the interceptor)', fakeAsync(() => {
      const { el, ids, type, http, fixture } = setup();
      type('pan');
      tick(300);
      http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'pan').flush('', { status: 500, statusText: 'x' });
      fixture.detectChanges();
      expect(ids()).toEqual(['#1', '#2', '#3']);
      expect(el.querySelector('.count')?.textContent).toContain('no se pudo buscar');
    }));

    it('shows how many tasks match and lets the user clear the filters', fakeAsync(() => {
      const { el, fixture, ids, search } = setup();
      expect(el.querySelector('.link')).toBeNull(); // sin filtros no hay "Limpiar"

      search('pan', [SMALL[0]]);
      expect(el.querySelector('.count')?.textContent).toContain('1–1 de 1 tareas (filtradas de 3)');

      el.querySelector<HTMLButtonElement>('.link')!.click();
      fixture.detectChanges();
      tick(300); // la búsqueda vacía se aplica tras la pausa
      fixture.detectChanges();
      expect(ids()).toEqual(['#1', '#2', '#3']);
      expect(el.querySelector('.link')).toBeNull();
    }));

    it('«Limpiar filtros» también quita la prioridad', () => {
      const { el, fixture, ids, selectByLabel } = setup([{ ...SMALL[0], priority: 'high' }, SMALL[1], SMALL[2]]);
      selectByLabel('Filtrar por prioridad', 'Alta');
      expect(ids()).toEqual(['#1']);
      el.querySelector<HTMLButtonElement>('.link')!.click();
      fixture.detectChanges();
      expect(ids().length).toBe(3);
    });
  });

  describe('empty states', () => {
    it('offers to clear filters when nothing matches', fakeAsync(() => {
      const { el, fixture, ids, search } = setup();
      search('zzz', []);
      expect(el.querySelector('.state')?.textContent).toContain('Ninguna tarea coincide');

      el.querySelector<HTMLButtonElement>('.state button')!.click();
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      expect(ids().length).toBe(3);
    }));

    it('offers to create a task when there are none at all', () => {
      const { el } = setup([]);
      expect(el.querySelector('.state')?.textContent).toContain('Aún no hay tareas');
      expect(el.querySelector('.state a')?.textContent).toContain('Crear tarea');
    });
  });

  describe('load error and edit', () => {
    it('«Reintentar» vuelve a pedir las tareas desde el estado de error (reload de la fachada)', () => {
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();
      http.expectOne(TODOS).flush('no', { status: 404, statusText: 'Not Found' }); // un 4xx no se reintenta solo
      http.expectOne(USERS).flush(USER_LIST);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.state')?.textContent).toContain('Reintentar');

      el.querySelector<HTMLButtonElement>('.state button')!.click();
      http.expectOne(TODOS).flush(SMALL);
      fixture.detectChanges();
      expect(el.querySelectorAll('.meta').length).toBe(3);
    });

    it('«Editar» de una tarjeta abre el formulario de edición de esa tarea', () => {
      const { el } = setup();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const editar = Array.from(el.querySelectorAll<HTMLButtonElement>('button')).filter((b) => b.textContent?.trim() === 'Editar');
      editar[1].click();
      expect(navigate).toHaveBeenCalledWith(['/tasks', 2, 'edit']);
    });
  });

  describe('sorting', () => {
    it('sorts by most recent by default', () => {
      expect(setup().ids()).toEqual(['#1', '#2', '#3']);
    });

    it('sorts by date, title and status', () => {
      const { ids, selectByLabel } = setup();
      selectByLabel('Ordenar por', 'Más antiguas');
      expect(ids()).toEqual(['#3', '#2', '#1']);
      selectByLabel('Ordenar por', 'Título A–Z');
      expect(ids()).toEqual(['#1', '#3', '#2']); // Comprar, Estudiar, Llamar
      selectByLabel('Ordenar por', 'Título Z–A');
      expect(ids()).toEqual(['#2', '#3', '#1']);
      selectByLabel('Ordenar por', 'Pendientes primero');
      expect(ids()[0]).toBe('#2');
      selectByLabel('Ordenar por', 'Completadas primero');
      expect(ids()[2]).toBe('#2');
    });
  });

  describe('view mode', () => {
    it('switches between cards and list view', () => {
      const { fixture, el } = setup();
      const buttons = el.querySelectorAll<HTMLButtonElement>('.view-toggle button');
      const container = () => el.querySelector('.task-list')!;

      expect(container().classList).not.toContain('task-list--rows');
      buttons[1].click();
      fixture.detectChanges();
      expect(container().classList).toContain('task-list--rows');
      buttons[0].click();
      fixture.detectChanges();
      expect(container().classList).not.toContain('task-list--rows');
    });
  });

  describe('pagination', () => {
    const many: Task[] = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      userId: 1,
      title: `tarea ${i + 1}`,
      completed: false, priority: 'medium',
      createdAt: new Date(2024, 0, 1, 0, 30 - i).toISOString(), // id 1 = la más reciente
    }));

    it('shows 10 tasks per page by default and navigates between pages', () => {
      const { fixture, el, ids } = setup(many);
      expect(ids().length).toBe(10);
      expect(el.querySelector('.count')?.textContent).toContain('1–10 de 30');

      el.querySelectorAll<HTMLButtonElement>('.pager button')[1].click(); // Siguiente
      fixture.detectChanges();
      expect(ids()[0]).toBe('#11');
      expect(el.querySelector('.pager')?.textContent).toContain('Página 2 de 3');
    });

    it('goes back to page 1 when a filter changes', fakeAsync(() => {
      const { fixture, el, ids, search } = setup(many);
      el.querySelectorAll<HTMLButtonElement>('.pager button')[1].click();
      fixture.detectChanges();
      search('tarea 2', many.filter((t) => t.title.toLowerCase().includes('tarea 2')));
      expect(ids()[0]).toBe('#2');
    }));

    it('lets the user choose the page size, including all', () => {
      const { fixture, el, ids } = setup(many);
      const select = el.querySelector<HTMLSelectElement>('.page-size select')!;
      const options = Array.from(select.options).map((o) => o.textContent?.trim());
      expect(options).toEqual(['10', '25', '50', '100', 'Todos']);

      select.selectedIndex = 1; // 25
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(ids().length).toBe(25);
      expect(el.querySelector('.pager')?.textContent).toContain('Página 1 de 2');

      select.selectedIndex = 4; // Todos
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(ids().length).toBe(30);
      expect(el.querySelector('.pager')).toBeNull();
      expect(el.querySelector('.count')?.textContent).toContain('1–30 de 30');
    });

    it('has no pager when everything fits in one page', () => {
      expect(setup().el.querySelector('.pager')).toBeNull();
    });
  });

  describe('status change', () => {
    it('asks for confirmation and does nothing if cancelled', async () => {
      const { fixture, el, http } = setup();
      const ask = spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(false);
      el.querySelector<HTMLButtonElement>('.status')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(ask).toHaveBeenCalled();
      http.expectNone({ method: 'PUT' });
      expect(el.querySelector('.status')?.textContent).toContain('Completada');
    });

    it('changes the status and shows a toast when confirmed', async () => {
      const { fixture, el, http } = setup();
      spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(true);
      el.querySelector<HTMLButtonElement>('.status')!.click(); // tarea #1, completada -> pendiente
      await fixture.whenStable();
      http.expectOne({ method: 'PUT', url: `${TODOS}/1` }).flush({});
      fixture.detectChanges();

      expect(el.querySelector('.status')?.textContent).toContain('Pendiente');
      expect(TestBed.inject(ToastService).toasts()[0].message).toContain('pendiente');
    });
  });

  describe('delete and undo', () => {
    it('does not delete when the dialog is cancelled', async () => {
      const { fixture, el, http, ids } = setup();
      spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(false);
      el.querySelector<HTMLButtonElement>('.btn-danger')!.click();
      await fixture.whenStable();
      http.expectNone({ method: 'DELETE' });
      expect(ids().length).toBe(3);
    });

    it('deletes with a toast that can undo it', async () => {
      const { fixture, ids, el, http } = setup();
      spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(true);
      el.querySelectorAll<HTMLButtonElement>('.btn-danger')[1].click(); // tarea #2
      await fixture.whenStable();
      http.expectOne({ method: 'DELETE', url: `${TODOS}/2` }).flush({});
      fixture.detectChanges();
      expect(ids()).toEqual(['#1', '#3']);

      const toasts = TestBed.inject(ToastService);
      expect(toasts.toasts()[0].actionLabel).toBe('Deshacer');
      toasts.runAction(toasts.toasts()[0]);
      fixture.detectChanges();
      expect(ids()).toEqual(['#1', '#2', '#3']);
    });
  });

  describe('filters in the URL', () => {
    async function setupWithRoute(url: string, tasks: Task[] = SMALL) {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([{ path: 'tasks', component: TaskListComponent }]),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
      const http = TestBed.inject(HttpTestingController);
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url, TaskListComponent);
      http.expectOne(TODOS).flush(tasks);
      http.expectOne(USERS).flush(USER_LIST);
      harness.detectChanges();
      const settle = async () => {
        harness.detectChanges();
        await harness.fixture.whenStable();
        harness.detectChanges();
      };
      return { harness, router: TestBed.inject(Router), settle, ...helpers(harness.fixture as never, http) };
    }

    it('applies the filters found in the URL', async () => {
      const { ids } = await setupWithRoute('/tasks?estado=pending&usuario=1');
      expect(ids()).toEqual(['#2']);
    });

    it('applies the search and the sort found in the URL', async () => {
      const { ids, http, harness } = await setupWithRoute('/tasks?q=angular&orden=title-desc');
      await new Promise((r) => setTimeout(r, 350)); // pausa del debounce
      http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'angular').flush([SMALL[2]]);
      harness.detectChanges();
      expect(ids()).toEqual(['#3']);
    });

    it('applies the priority found in the URL', async () => {
      const { ids } = await setupWithRoute('/tasks?prioridad=high', [{ ...SMALL[0], priority: 'high' }, SMALL[1], SMALL[2]]);
      expect(ids()).toEqual(['#1']);
    });

    it('writes the priority to the URL as it changes', async () => {
      const { harness, router, selectByLabel } = await setupWithRoute('/tasks');
      selectByLabel('Filtrar por prioridad', 'Baja');
      harness.detectChanges();
      await harness.fixture.whenStable();
      expect(router.url).toContain('prioridad=low');
    });

    it('ignores invalid values in the URL', async () => {
      const { ids } = await setupWithRoute('/tasks?estado=nada&usuario=abc&orden=raro&tam=7&pag=-3');
      expect(ids()).toEqual(['#1', '#2', '#3']);
    });

    it('writes the filters to the URL as they change', async () => {
      const { harness, router, type, selectByLabel } = await setupWithRoute('/tasks');
      type('pan');
      selectByLabel('Filtrar por estado', 'Completadas');
      harness.detectChanges();
      await harness.fixture.whenStable();
      expect(router.url).toContain('q=pan');
      expect(router.url).toContain('estado=completed');
    });

    describe('reading the URL in ngOnInit', () => {
      const many: Task[] = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        userId: 1,
        title: `tarea ${i + 1}`,
        completed: false, priority: 'medium',
        createdAt: new Date(2024, 0, 1, 0, 30 - i).toISOString(),
      }));

      it('opens the page and the page size given in the URL', async () => {
        const { ids } = await setupWithRoute('/tasks?pag=2&tam=10', many);
        expect(ids()[0]).toBe('#11');
        expect(ids().length).toBe(10);
      });

      it('keeps the filters in the URL after starting (they are not overwritten by the defaults)', async () => {
        const { harness, router, settle } = await setupWithRoute('/tasks?estado=pending&usuario=1&pag=2&tam=10', many);
        harness.detectChanges();
        await settle();
        expect(router.url).toContain('estado=pending');
        expect(router.url).toContain('usuario=1');
        expect(router.url).toContain('pag=2');
      });

      it('goes back to page 1 when a filter changes after the initial page was restored', async () => {
        const { ids, type, harness, http } = await setupWithRoute('/tasks?pag=3&tam=10', many);
        expect(ids()[0]).toBe('#21');
        type('tarea 1');
        await new Promise((r) => setTimeout(r, 350)); // pausa del debounce
        http
          .expectOne((r) => r.url === TODOS && r.params.get('q') === 'tarea 1')
          .flush(many.filter((t) => t.title.toLowerCase().includes('tarea 1')));
        harness.detectChanges();
        expect(ids()[0]).toBe('#1');
      });
    });
  });
});
