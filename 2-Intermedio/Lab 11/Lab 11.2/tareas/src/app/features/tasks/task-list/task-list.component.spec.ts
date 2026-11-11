import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Task } from '../../../core/models/task.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { TaskListComponent } from './task-list.component';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';
const USER_LIST = [
  { id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' },
  { id: 2, name: 'Ervin', username: 'e', email: 'e@e.com' },
];

const SMALL: Task[] = [
  { id: 1, userId: 1, title: 'Comprar pan', completed: true, createdAt: '2024-01-03T00:00:00Z' },
  { id: 2, userId: 1, title: 'Llamar al médico', completed: false, createdAt: '2024-01-02T00:00:00Z' },
  { id: 3, userId: 2, title: 'Estudiar Angular', completed: true, createdAt: '2024-01-01T00:00:00Z' },
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
    return { fixture, el, http, ids, type, selectByLabel };
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

    it('searches by title ignoring case and accents', () => {
      const { ids, type } = setup();
      type('MEDICO');
      expect(ids()).toEqual(['#2']);
      type('angular');
      expect(ids()).toEqual(['#3']);
    });

    it('shows how many tasks match and lets the user clear the filters', () => {
      const { el, fixture, ids, type } = setup();
      expect(el.querySelector('.link')).toBeNull(); // sin filtros no hay "Limpiar"

      type('pan');
      expect(el.querySelector('.count')?.textContent).toContain('1–1 de 1 tareas (filtradas de 3)');

      el.querySelector<HTMLButtonElement>('.link')!.click();
      fixture.detectChanges();
      expect(ids()).toEqual(['#1', '#2', '#3']);
      expect(el.querySelector('.link')).toBeNull();
    });
  });

  describe('empty states', () => {
    it('offers to clear filters when nothing matches', () => {
      const { el, fixture, ids, type } = setup();
      type('zzz');
      expect(el.querySelector('.state')?.textContent).toContain('Ninguna tarea coincide');

      el.querySelector<HTMLButtonElement>('.state button')!.click();
      fixture.detectChanges();
      expect(ids().length).toBe(3);
    });

    it('offers to create a task when there are none at all', () => {
      const { el } = setup([]);
      expect(el.querySelector('.state')?.textContent).toContain('Aún no hay tareas');
      expect(el.querySelector('.state a')?.textContent).toContain('Crear tarea');
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
      completed: false,
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

    it('goes back to page 1 when a filter changes', () => {
      const { fixture, el, ids, type } = setup(many);
      el.querySelectorAll<HTMLButtonElement>('.pager button')[1].click();
      fixture.detectChanges();
      type('tarea 2');
      expect(ids()[0]).toBe('#2');
    });

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
      const { ids } = await setupWithRoute('/tasks?q=angular&orden=title-desc');
      expect(ids()).toEqual(['#3']);
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
        completed: false,
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
        const { ids, type, harness } = await setupWithRoute('/tasks?pag=3&tam=10', many);
        expect(ids()[0]).toBe('#21');
        type('tarea 1');
        harness.detectChanges();
        expect(ids()[0]).toBe('#1');
      });
    });
  });
});
