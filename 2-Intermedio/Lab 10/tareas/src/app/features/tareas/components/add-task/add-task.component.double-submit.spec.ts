import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { ToastService } from '@core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { Subject } from 'rxjs';
import { TaskDraft } from '../../models/task.model';
import { AddTaskComponent } from './add-task.component';

/** Protección de doble envío (Lab 15.2): `exhaustMap` ignora los envíos que llegan con uno en curso. */
describe('AddTaskComponent: doble envío (exhaustMap)', () => {
  const original = { ...environment };
  afterEach(() => Object.assign(environment, original));

  async function setup(persistent: boolean) {
    const base = persistent ? 'http://localhost:8000' : 'https://jsonplaceholder.typicode.com';
    environment.apiUrl = base;
    environment.persistentApi = persistent;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(AddTaskComponent);
    fixture.detectChanges();
    http.match(`${base}/users`).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
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
    const guardar = () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    return { fixture, http, navigate, guardar, base, toast: TestBed.inject(ToastService) };
  }

  it('pulsar «Guardar» varias veces seguidas crea una sola tarea', async () => {
    const { http, navigate, guardar, base, toast } = await setup(false);
    guardar();
    guardar();
    guardar();
    http.expectOne({ method: 'GET', url: `${base}/todos` }).flush([]); // carga inicial del TaskService
    const posts = http.match({ method: 'POST', url: `${base}/todos` });
    expect(posts.length).toBe(1);
    posts[0].flush({ id: 201 });
    await new Promise((resolve) => setTimeout(resolve)); // la fachada responde tras una promesa

    expect(toast.toasts().filter((t) => t.message.includes('creada')).length).toBe(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('el envío incluye la prioridad elegida', async () => {
    const { fixture, http, guardar, base } = await setup(false);
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>('#priority')!;
    select.selectedIndex = 0; // Alta
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    guardar();
    http.expectOne({ method: 'GET', url: `${base}/todos` }).flush([]);
    const post = http.expectOne({ method: 'POST', url: `${base}/todos` });
    expect(post.request.body.priority).toBe('high');
    post.flush({ id: 201 });
  });

  it('si el alta falla (backend propio) el flujo sigue vivo: se puede volver a intentar', async () => {
    const { http, navigate, guardar, base, toast } = await setup(true);
    guardar();
    http.expectOne({ method: 'GET', url: `${base}/todos` }).flush([]);
    http.expectOne({ method: 'POST', url: `${base}/todos` }).flush({ detail: 'El usuario 1 no existe' }, { status: 422, statusText: 'x' });
    await new Promise((resolve) => setTimeout(resolve)); // la fachada rechaza tras una promesa
    expect(navigate).not.toHaveBeenCalled();
    expect(toast.toasts().map((t) => t.message)).toEqual(['No se pudo crear la tarea: El usuario 1 no existe.']);

    guardar(); // segundo intento: el flujo no se ha cerrado con el error
    const retry = http.expectOne({ method: 'POST', url: `${base}/todos` });
    retry.flush({ id: 301, userId: 1, title: 'Comprar pan', completed: false, priority: 'medium', createdAt: '2026-01-01T00:00:00.000Z' });
    await new Promise((resolve) => setTimeout(resolve)); // la fachada responde tras una promesa
    expect(navigate).toHaveBeenCalledOnceWith(['/tasks']);
  });

  it('al destruirse el componente cierra el flujo (takeUntilDestroyed) y deja de atender envíos', async () => {
    const { fixture, http, base } = await setup(false);
    const flujo = (fixture.componentInstance as unknown as { create$: Subject<TaskDraft> }).create$;
    fixture.destroy();
    flujo.next({ title: 'Tarde', userId: 1, completed: false, priority: 'medium' });
    http.expectNone({ method: 'POST', url: `${base}/todos` });
    expect(flujo.observed).toBeFalse(); // ya no hay nadie suscrito
  });
});
