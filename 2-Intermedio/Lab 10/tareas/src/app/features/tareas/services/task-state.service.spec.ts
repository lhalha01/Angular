import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task } from '../models/task.model';
import { TaskStateService } from './task-state.service';
import { TaskService } from './task.service';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const tarea = (id: number, completed: boolean): Task => ({ id, userId: 1, title: `t${id}`, completed, priority: 'medium' });

describe('TaskStateService', () => {
  let http: HttpTestingController;
  let state: TaskStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(TaskStateService); // crea TaskService, que pide la lista
  });

  it('expone el estado de la carga y las tareas del servicio, y empieza vacío', () => {
    expect(state.status()).toBe('loading');
    expect(state.tasks()).toEqual([]);
    expect(state.total()).toBe(0);
    http.expectOne(TODOS).flush([tarea(1, false), tarea(2, true)]);
    expect(state.status()).toBe('ready');
    expect(state.tasks().length).toBe(2);
  });

  it('pending, completed y total son computed() sobre las tareas', () => {
    http.expectOne(TODOS).flush([tarea(1, false), tarea(2, true), tarea(3, false)]);
    expect(state.pending().map((t) => t.id)).toEqual([1, 3]);
    expect(state.completed().map((t) => t.id)).toEqual([2]);
    expect(state.total()).toBe(3);
  });

  it('se recalculan solos cuando cambian las tareas (alta, cambio y baja)', () => {
    http.expectOne(TODOS).flush([tarea(1, false), tarea(2, true)]);
    const servicio = TestBed.inject(TaskService);

    servicio.addTask({ title: 'nueva', userId: 1, completed: false, priority: 'medium' }).subscribe();
    http.expectOne({ method: 'POST', url: TODOS }).flush({ id: 201 });
    expect(state.total()).toBe(3);
    expect(state.pending().length).toBe(2);

    servicio.updateTask({ ...tarea(1, false), completed: true }).subscribe();
    http.expectOne({ method: 'PUT', url: `${TODOS}/1` }).flush({});
    expect(state.completed().map((t) => t.id)).toEqual([1, 2]);

    servicio.deleteTask(2).subscribe();
    http.expectOne({ method: 'DELETE', url: `${TODOS}/2` }).flush({});
    expect(state.total()).toBe(2);
    expect(state.completed().map((t) => t.id)).toEqual([1]);
  });

  it('solo expone señales de lectura (no se puede escribir desde fuera)', () => {
    http.expectOne(TODOS).flush([]);
    for (const señal of [state.tasks, state.status, state.pending, state.completed, state.total]) {
      expect((señal as unknown as { set?: unknown }).set).toBeUndefined();
    }
  });
});
