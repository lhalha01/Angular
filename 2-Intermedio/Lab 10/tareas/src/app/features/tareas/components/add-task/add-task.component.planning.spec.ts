import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Task } from '../../models/task.model';
import { AddTaskComponent } from './add-task.component';
import { TaskEditComponent } from '../task-edit/task-edit.component';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const USERS = 'https://jsonplaceholder.typicode.com/users';

/** Lab 16.2: el formulario envía a la API la descripción, las fechas y las etiquetas (y borra lo que se vacía). */
describe('formularios de tarea: planificación (descripción, fechas y etiquetas)', () => {
  async function montar<T>(componente: new () => T, entrada?: { nombre: string; valor: unknown }) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(componente);
    if (entrada) fixture.componentRef.setInput(entrada.nombre, entrada.valor);
    fixture.detectChanges();
    http.match(USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const poner = async (selector: string, valor: string) => {
      const c = el.querySelector<HTMLInputElement>(selector)!;
      c.value = valor;
      c.dispatchEvent(new Event('input'));
      await settle();
    };
    const guardar = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await settle();
    };
    return { http, el, settle, poner, guardar };
  }

  it('crear: el POST lleva la descripción, las fechas, las etiquetas y la prioridad', async () => {
    const { http, el, poner, guardar, settle } = await montar(AddTaskComponent);
    await poner('#title', 'Preparar la demo');
    await poner('#description', 'Revisar las diapositivas');
    await poner('#startDate', '2026-03-01');
    await poner('#endDate', '2026-03-05');
    Array.from(el.querySelectorAll<HTMLButtonElement>('button[type="button"]')).find((b) => b.textContent?.includes('Añadir etiqueta'))!.click();
    await settle();
    await poner('.tag-row input', 'demo');

    await guardar();
    http.expectOne({ method: 'GET', url: TODOS }).flush([]);
    const post = http.expectOne({ method: 'POST', url: TODOS });
    expect(post.request.body).toEqual(
      jasmine.objectContaining({
        title: 'Preparar la demo',
        description: 'Revisar las diapositivas',
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        tags: ['demo'],
        priority: 'medium',
      }),
    );
    post.flush({ id: 201 });
  });

  it('crear sin planificación: el POST lleva los campos vacíos (null y [])', async () => {
    const { http, poner, guardar } = await montar(AddTaskComponent);
    await poner('#title', 'Comprar pan');
    await guardar();
    http.expectOne({ method: 'GET', url: TODOS }).flush([]);
    const post = http.expectOne({ method: 'POST', url: TODOS });
    expect(post.request.body).toEqual(jasmine.objectContaining({ description: null, startDate: null, endDate: null, tags: [] }));
    post.flush({ id: 201 });
  });

  it('crear con las fechas al revés no envía nada y avisa del error', async () => {
    const { http, el, poner, guardar } = await montar(AddTaskComponent);
    await poner('#title', 'Comprar pan');
    await poner('#startDate', '2026-03-10');
    await poner('#endDate', '2026-03-01');
    await guardar();
    http.expectNone({ method: 'POST', url: TODOS });
    expect(el.querySelector('.error--group')?.textContent).toContain('anterior');
  });

  describe('editar', () => {
    const TASK: Task = {
      id: 4,
      userId: 1,
      title: 'Estudiar Angular',
      completed: false,
      priority: 'high',
      description: 'Capítulo 16',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
      tags: ['rxjs', 'forms'],
      createdAt: '2024-03-05T10:00:00Z',
    };

    it('el formulario se rellena con la planificación de la tarea', async () => {
      const { el } = await montar(TaskEditComponent, { nombre: 'task', valor: TASK });
      expect(el.querySelector<HTMLTextAreaElement>('#description')!.value).toBe('Capítulo 16');
      expect(el.querySelector<HTMLInputElement>('#startDate')!.value).toBe('2026-03-01');
      expect(Array.from(el.querySelectorAll<HTMLInputElement>('.tag-row input')).map((i) => i.value)).toEqual(['rxjs', 'forms']);
    });

    it('guardar sin tocar la planificación la conserva en el PUT', async () => {
      const { http, guardar } = await montar(TaskEditComponent, { nombre: 'task', valor: TASK });
      await guardar();
      http.expectOne(TODOS).flush([TASK]);
      const put = http.expectOne({ method: 'PUT', url: `${TODOS}/4` });
      expect(put.request.body).toEqual(
        jasmine.objectContaining({ description: 'Capítulo 16', startDate: '2026-03-01', endDate: '2026-03-05', tags: ['rxjs', 'forms'], priority: 'high' }),
      );
      put.flush({});
    });

    it('vaciar la descripción, una fecha y las etiquetas las borra: el PUT lleva null y []', async () => {
      const { http, el, poner, guardar, settle } = await montar(TaskEditComponent, { nombre: 'task', valor: TASK });
      await poner('#description', '');
      await poner('#endDate', '');
      for (let i = 0; i < 2; i++) {
        el.querySelector<HTMLButtonElement>('.tag-row button')!.click();
        await settle();
      }
      await guardar();
      http.expectOne(TODOS).flush([TASK]);
      const put = http.expectOne({ method: 'PUT', url: `${TODOS}/4` });
      expect(put.request.body).toEqual(jasmine.objectContaining({ description: null, endDate: null, tags: [], startDate: '2026-03-01' }));
      put.flush({});
    });
  });
});
