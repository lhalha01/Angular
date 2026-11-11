import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OPERACION } from '@core/interceptors/http-context';
import { Task } from '../models/task.model';
import { TaskService } from './task.service';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';

describe('TaskService.search (Lab 15.2)', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
    http.expectOne({ method: 'GET', url: TODOS }).flush([]); // la carga inicial del servicio
  });
  afterEach(() => http.verify());

  const api = (id: number, title: string, extra: object = {}) => ({ id, userId: 1, title, completed: false, ...extra });
  const request = (term: string) => http.expectOne((r) => r.url === TODOS && r.params.get('q') === term);

  it('pide /todos?q=<término> a la API', () => {
    service.search('pan').subscribe();
    const req = request('pan');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('recorta el término antes de enviarlo', () => {
    service.search('  pan  ').subscribe();
    request('pan').flush([]);
  });

  it('traduce la respuesta al dominio (el DTO no sale del servicio) y pone prioridad media si la API no la trae', () => {
    let tareas: Task[] = [];
    service.search('pan').subscribe((t) => (tareas = t));
    request('pan').flush([api(1, 'Comprar pan'), api(2, 'Pan integral', { priority: 'high', createdAt: '2026-01-01T00:00:00.000Z' })]);
    expect(tareas.map((t) => [t.id, t.title, t.priority])).toEqual([
      [1, 'Comprar pan', 'medium'],
      [2, 'Pan integral', 'high'],
    ]);
  });

  it('descarta los elementos con forma inválida y tolera lo que no es una lista', () => {
    let tareas: Task[] | undefined;
    service.search('pan').subscribe((t) => (tareas = t));
    request('pan').flush([api(1, 'Comprar pan'), { id: 'x' }, null, api(3, 'Mala prioridad', { priority: 'urgente' })]);
    expect(tareas?.map((t) => t.id)).toEqual([1]);

    service.search('otra').subscribe((t) => (tareas = t));
    request('otra').flush({ detalle: 'no soy una lista' });
    expect(tareas).toEqual([]);
  });

  it('declara en el contexto qué se intentaba, para el aviso del interceptor', () => {
    service.search('pan').subscribe();
    const req = request('pan');
    expect(req.request.context.get(OPERACION)).toBe('No se pudo buscar en las tareas');
    req.flush([]);
  });

  it('propaga el error (la lista lo muestra y el interceptor avisa) y no reintenta', () => {
    let error: { status: number } | undefined;
    service.search('pan').subscribe({ error: (e) => (error = e) });
    request('pan').flush('', { status: 500, statusText: 'x' });
    expect(error?.status).toBe(500);
    http.expectNone((r) => r.url === TODOS && r.params.has('q')); // sin reintento
  });
});
