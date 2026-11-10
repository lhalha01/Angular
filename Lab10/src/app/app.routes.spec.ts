import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { Task } from './core/models/task.model';
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
});
