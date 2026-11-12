import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { Task } from '../../models/task.model';
import { ToastService } from '@core/services/toast.service';
import { TaskEditComponent } from './task-edit.component';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';
const TASK: Task = { id: 4, userId: 1, title: 'Estudiar Angular', completed: false, priority: 'medium', createdAt: '2024-03-05T10:00:00Z' };

describe('TaskEditComponent', () => {
  async function setup(task: Task | null) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(TaskEditComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    http.match(USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, navigate, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the form filled with the task', async () => {
    const { el } = await setup(TASK);
    expect(el.querySelector('.eyebrow')?.textContent).toContain('#4');
    expect(el.querySelector<HTMLInputElement>('#title')?.value).toBe('Estudiar Angular');
  });

  it('shows a "not found" message when there is no task', async () => {
    const { el } = await setup(null);
    expect(el.querySelector('.state')?.textContent).toContain('No se encontró la tarea');
    expect(el.querySelector('app-task-form')).toBeNull();
  });

  it('saves the changes, shows a toast and goes to the detail page', async () => {
    const { fixture, http, navigate, el } = await setup(TASK);
    // El servicio de tareas solo se crea cuando se usa: se responde a su carga inicial.
    const title = el.querySelector<HTMLInputElement>('#title')!;
    title.value = 'Título nuevo';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    http.expectOne(TODOS).flush([TASK]); // carga inicial del TaskService
    http.expectOne({ method: 'PUT', url: `${TODOS}/4` }).flush({});
    await new Promise((resolve) => setTimeout(resolve)); // la fachada responde tras una promesa

    expect(navigate).toHaveBeenCalledWith(['/tasks', 4]);
    expect(TestBed.inject(ToastService).toasts()[0].message).toContain('#4 actualizada');
  });

  it('goes back to the detail page when cancelled, without saving', async () => {
    const { el, http, navigate } = await setup(TASK);
    Array.from(el.querySelectorAll<HTMLButtonElement>('button[type="button"]')).find((b) => b.textContent?.includes('Cancelar'))!.click();
    expect(navigate).toHaveBeenCalledWith(['/tasks', 4]);
    http.expectNone({ method: 'PUT' });
  });
});

/** Con el backend propio, si la API rechaza el cambio el usuario lo ve y se queda en el formulario. */
describe('TaskEditComponent with the own backend (persistentApi)', () => {
  const LOCAL_TODOS = 'http://localhost:8000/todos';
  const LOCAL_USERS = 'http://localhost:8000/users';
  const original = { ...environment };

  afterEach(() => Object.assign(environment, original)); // no contaminar al resto de tests

  async function setupAndSave() {
    environment.apiUrl = 'http://localhost:8000';
    environment.persistentApi = true;
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(TaskEditComponent);
    fixture.componentRef.setInput('task', TASK);
    fixture.detectChanges();
    http.match(LOCAL_USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const title = el.querySelector<HTMLInputElement>('#title')!;
    title.value = 'Título nuevo';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    http.expectOne(LOCAL_TODOS).flush([TASK]); // carga inicial del TaskService
    return { http, navigate, toast: TestBed.inject(ToastService) };
  }

  it('saves with a PUT to the backend, shows a toast and goes to the detail page', async () => {
    const { http, navigate, toast } = await setupAndSave();
    const put = http.expectOne({ method: 'PUT', url: `${LOCAL_TODOS}/4` });
    expect(put.request.body.title).toBe('Título nuevo');
    put.flush({ ...TASK, title: 'Título nuevo' });
    await new Promise((resolve) => setTimeout(resolve)); // la fachada responde tras una promesa
    expect(toast.toasts()[0].message).toContain('#4 actualizada');
    expect(navigate).toHaveBeenCalledWith(['/tasks', 4]);
  });

  it('shows why it failed and stays on the form when the API rejects the change', async () => {
    const { http, navigate, toast } = await setupAndSave();
    http
      .expectOne({ method: 'PUT', url: `${LOCAL_TODOS}/4` })
      .flush({ detail: 'Tarea 4 no encontrada' }, { status: 404, statusText: 'Not Found' });
    await new Promise((resolve) => setTimeout(resolve)); // la fachada rechaza tras una promesa
    expect(toast.toasts().map((t) => t.message)).toEqual(['No se pudo actualizar la tarea: Tarea 4 no encontrada.']);
    expect(navigate).not.toHaveBeenCalled();
  });
});
