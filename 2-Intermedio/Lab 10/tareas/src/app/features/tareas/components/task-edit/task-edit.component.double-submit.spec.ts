import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { Task } from '../../models/task.model';
import { TaskEditComponent } from './task-edit.component';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';
const TASK: Task = { id: 4, userId: 1, title: 'Estudiar Angular', completed: false, priority: 'low', createdAt: '2024-03-05T10:00:00Z' };

/** Protección de doble guardado (Lab 15.2): `exhaustMap` ignora los envíos que llegan con uno en curso. */
describe('TaskEditComponent: doble envío (exhaustMap)', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(TaskEditComponent);
    fixture.componentRef.setInput('task', TASK);
    fixture.detectChanges();
    http.match(USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const title = el.querySelector<HTMLInputElement>('#title')!;
    title.value = 'Título nuevo';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, http, navigate, el, guardar: () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click() };
  }

  it('pulsar «Guardar cambios» varias veces seguidas guarda una sola vez', async () => {
    const { http, navigate, guardar } = await setup();
    guardar();
    guardar();
    guardar();
    http.expectOne(TODOS).flush([TASK]); // carga inicial del TaskService
    const puts = http.match({ method: 'PUT', url: `${TODOS}/4` });
    expect(puts.length).toBe(1);
    puts[0].flush({});
    await new Promise((resolve) => setTimeout(resolve)); // la fachada responde tras una promesa

    expect(TestBed.inject(ToastService).toasts().filter((t) => t.message.includes('actualizada')).length).toBe(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('conserva la prioridad de la tarea al guardar (el formulario la lleva)', async () => {
    const { http, guardar } = await setup();
    guardar();
    http.expectOne(TODOS).flush([TASK]);
    const put = http.expectOne({ method: 'PUT', url: `${TODOS}/4` });
    expect(put.request.body.priority).toBe('low');
    put.flush({});
  });

  it('el formulario muestra la prioridad actual de la tarea', async () => {
    const { el } = await setup();
    const select = el.querySelector<HTMLSelectElement>('#priority')!;
    expect(select.options[select.selectedIndex].textContent?.trim()).toBe('Baja');
  });
});
