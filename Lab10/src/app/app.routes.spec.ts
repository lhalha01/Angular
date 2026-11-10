import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { Task } from './core/models/task.model';
import { ConfirmService } from './core/services/confirm.service';
import { TaskService } from './core/services/task.service';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';
const SEED: Task[] = [
  { id: 1, userId: 1, title: 'Comprar pan', completed: true, createdAt: '2024-01-03T00:00:00Z' },
  { id: 2, userId: 1, title: 'Llamar al médico', completed: false, createdAt: '2024-01-02T00:00:00Z' },
];

/** Integración de las rutas reales: resolver, herencia del :id y navegación entre hijas. */
describe('task routes', () => {
  async function setup() {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(TaskService); // arranca la carga inicial
    http.expectOne(TODOS).flush(SEED);

    const harness = await RouterTestingHarness.create();
    const settle = async () => {
      http.match(USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
      harness.detectChanges();
      await harness.fixture.whenStable();
      harness.detectChanges();
    };
    return { harness, http, router: TestBed.inject(Router), settle, text: () => harness.routeNativeElement?.textContent ?? '' };
  }

  it('shows the task detail resolved from the :id parameter', async () => {
    const { harness, settle, text } = await setup();
    await harness.navigateByUrl('/tasks/2');
    await settle();
    expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toContain('Llamar al médico');
    expect(text()).toContain('Detalle de tarea');
  });

  it('shows "not found" for an id that does not exist', async () => {
    const { harness, settle, text } = await setup();
    await harness.navigateByUrl('/tasks/999');
    await settle();
    expect(text()).toContain('No se encontró la tarea');
  });

  it('shows "not found" for an id that is not a number', async () => {
    const { harness, settle, text } = await setup();
    await harness.navigateByUrl('/tasks/abc');
    await settle();
    expect(text()).toContain('No se encontró la tarea');
  });

  it('opens the edit form (child route) with the resolved task', async () => {
    const { harness, settle } = await setup();
    await harness.navigateByUrl('/tasks/2/edit');
    await settle();
    expect(harness.routeNativeElement?.querySelector<HTMLInputElement>('#title')?.value).toBe('Llamar al médico');
  });

  it('shows the edited data on the detail page after saving', async () => {
    const { harness, http, router, settle } = await setup();
    await harness.navigateByUrl('/tasks/2/edit');
    await settle();

    const title = harness.routeNativeElement!.querySelector<HTMLInputElement>('#title')!;
    title.value = 'Título editado';
    title.dispatchEvent(new Event('input'));
    await settle();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    http.expectOne({ method: 'PUT', url: `${TODOS}/2` }).flush({});
    await settle();

    expect(router.url).toBe('/tasks/2');
    // Sin runGuardsAndResolvers: 'always' el detalle enseñaría aquí el título antiguo.
    expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toContain('Título editado');
  });

  it('redirects unknown routes to the home page', async () => {
    const { harness, router, settle } = await setup();
    await harness.navigateByUrl('/no-existe');
    await settle();
    expect(router.url).toBe('/');
  });

  describe('unsaved changes guard', () => {
    const type = (root: HTMLElement, value: string) => {
      const title = root.querySelector<HTMLInputElement>('#title')!;
      title.value = value;
      title.dispatchEvent(new Event('input'));
    };

    it('lets the user leave the creation form without asking when nothing was typed', async () => {
      const { harness, router, settle } = await setup();
      const ask = spyOn(TestBed.inject(ConfirmService), 'ask');
      await harness.navigateByUrl('/add-task');
      await settle();

      await router.navigateByUrl('/');
      expect(ask).not.toHaveBeenCalled();
      expect(router.url).toBe('/');
    });

    it('asks before leaving a form with changes, and stays if the user keeps editing', async () => {
      const { harness, router, settle } = await setup();
      const ask = spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(false);
      await harness.navigateByUrl('/add-task');
      await settle();
      type(harness.routeNativeElement!, 'Comprar pan');
      await settle();

      await router.navigateByUrl('/tasks');
      expect(ask).toHaveBeenCalledTimes(1);
      expect(router.url).toBe('/add-task');
      expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#title')!.value).toBe('Comprar pan');
    });

    it('leaves the form when the user accepts to discard the changes', async () => {
      const { harness, router, settle } = await setup();
      spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(true);
      await harness.navigateByUrl('/add-task');
      await settle();
      type(harness.routeNativeElement!, 'Comprar pan');
      await settle();

      await router.navigateByUrl('/tasks');
      expect(router.url).toBe('/tasks');
    });

    it('also protects the edit form', async () => {
      const { harness, router, settle } = await setup();
      const ask = spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(false);
      await harness.navigateByUrl('/tasks/2/edit');
      await settle();
      type(harness.routeNativeElement!, 'Título distinto');
      await settle();

      await router.navigateByUrl('/tasks/2');
      expect(ask).toHaveBeenCalledTimes(1);
      expect(router.url).toBe('/tasks/2/edit');
    });

    it('does not ask after saving (the save itself navigates away)', async () => {
      const { harness, http, router, settle } = await setup();
      const ask = spyOn(TestBed.inject(ConfirmService), 'ask');
      await harness.navigateByUrl('/tasks/2/edit');
      await settle();
      type(harness.routeNativeElement!, 'Título guardado');
      await settle();

      harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      http.expectOne({ method: 'PUT', url: `${TODOS}/2` }).flush({});
      await settle();

      expect(ask).not.toHaveBeenCalled();
      expect(router.url).toBe('/tasks/2');
    });

    it('does not guard the detail page', async () => {
      const { harness, router, settle } = await setup();
      const ask = spyOn(TestBed.inject(ConfirmService), 'ask');
      await harness.navigateByUrl('/tasks/2');
      await settle();
      await router.navigateByUrl('/');
      expect(ask).not.toHaveBeenCalled();
    });
  });
});
