import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '@core/services/toast.service';
import { AddTaskComponent } from './add-task.component';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';

describe('AddTaskComponent', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(AddTaskComponent);
    fixture.detectChanges();
    http.match(USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, http, navigate, el: fixture.nativeElement as HTMLElement };
  }

  async function fill(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }, el: HTMLElement, text: string) {
    const title = el.querySelector<HTMLInputElement>('#title')!;
    title.value = text;
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows the creation form', async () => {
    const { el } = await setup();
    expect(el.querySelector('h2')?.textContent).toContain('Crear tarea');
    expect(el.querySelector('app-task-form')).not.toBeNull();
  });

  it('creates the task, shows a toast and goes back to the list', async () => {
    const { fixture, http, navigate, el } = await setup();
    await fill(fixture, el, 'Comprar pan');

    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    http.expectOne({ method: 'GET', url: TODOS }).flush([]); // carga inicial del TaskService
    const post = http.expectOne({ method: 'POST', url: TODOS });
    expect(post.request.body).toEqual(jasmine.objectContaining({ title: 'Comprar pan', userId: 1, completed: false }));
    post.flush({ id: 201 });
    await new Promise((resolve) => setTimeout(resolve)); // la fachada responde tras una promesa

    expect(TestBed.inject(ToastService).toasts()[0].message).toContain('creada');
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('goes back to the list when cancelled, without creating anything', async () => {
    const { el, http, navigate } = await setup();
    Array.from(el.querySelectorAll<HTMLButtonElement>('button[type="button"]')).find((b) => b.textContent?.includes('Cancelar'))!.click();
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
    http.expectNone({ method: 'POST' });
  });
});

/** Con el backend propio, si la API rechaza el alta el usuario lo ve y se queda en el formulario. */
describe('AddTaskComponent with the own backend (persistentApi)', () => {
  const LOCAL_TODOS = 'http://localhost:8000/todos';
  const LOCAL_USERS = 'http://localhost:8000/users';
  const original = { ...environment };

  afterEach(() => Object.assign(environment, original)); // no contaminar al resto de tests

  async function setup() {
    environment.apiUrl = 'http://localhost:8000';
    environment.persistentApi = true;
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(AddTaskComponent);
    fixture.detectChanges();
    http.match(LOCAL_USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const title = el.querySelector<HTMLInputElement>('#title')!;
    title.value = 'Comprar pan';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    http.expectOne({ method: 'GET', url: LOCAL_TODOS }).flush([]); // carga inicial del TaskService
    return { http, navigate, toast: TestBed.inject(ToastService) };
  }

  it('creates the task with the id the server assigns, shows a toast and goes back', async () => {
    const { http, navigate, toast } = await setup();
    const post = http.expectOne({ method: 'POST', url: LOCAL_TODOS });
    expect('id' in post.request.body).toBeFalse();
    post.flush({ id: 301, userId: 1, title: 'Comprar pan', completed: false, createdAt: '2026-02-02T00:00:00.000Z' });
    await new Promise((resolve) => setTimeout(resolve)); // la fachada responde tras una promesa
    expect(toast.toasts()[0].message).toBe('Tarea #301 creada');
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('shows why it failed and stays on the form when the API rejects the task', async () => {
    const { http, navigate, toast } = await setup();
    http
      .expectOne({ method: 'POST', url: LOCAL_TODOS })
      .flush({ detail: 'El usuario 1 no existe' }, { status: 422, statusText: 'Unprocessable' });
    expect(toast.toasts().map((t) => t.message)).toEqual(['No se pudo crear la tarea: El usuario 1 no existe.']);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('says the backend is not reachable when there is no connection', async () => {
    const { http, navigate, toast } = await setup();
    http.expectOne({ method: 'POST', url: LOCAL_TODOS }).error(new ProgressEvent('error'));
    expect(toast.toasts()[0].message).toContain('¿Está arrancado el backend?');
    expect(navigate).not.toHaveBeenCalled();
  });
});
