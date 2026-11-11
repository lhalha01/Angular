import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Task } from '../models/task.model';
import { TaskService } from './task.service';

const API = 'https://jsonplaceholder.typicode.com/todos';
const seed: Task[] = [
  { id: 1, userId: 1, title: 'uno', completed: false, priority: 'medium' },
  { id: 2, userId: 2, title: 'dos', completed: true, priority: 'medium' },
];

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TaskService);
    http.expectOne(API).flush(seed);
  });

  afterEach(() => http.verify());

  it('loads the initial tasks', () => {
    expect(service.status()).toBe('ready');
    expect(service.tasks().length).toBe(2);
  });

  it('keeps unique local ids even though the API always answers id 201', () => {
    service.addTask({ title: 'a', userId: 1, completed: false, priority: 'medium' }).subscribe();
    http.expectOne({ method: 'POST', url: API }).flush({ id: 201 });
    service.addTask({ title: 'b', userId: 1, completed: false, priority: 'medium' }).subscribe();
    http.expectOne({ method: 'POST', url: API }).flush({ id: 201 });

    const ids = service.tasks().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('updates a task in memory', () => {
    service.updateTask({ ...seed[0], title: 'cambiado' }).subscribe();
    http.expectOne({ method: 'PUT', url: `${API}/1` }).flush({});
    expect(service.tasks().find((t) => t.id === 1)?.title).toBe('cambiado');
  });

  it('removes a task in memory and does not bring it back by id', () => {
    service.deleteTask(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${API}/1` }).flush({});
    expect(service.tasks().length).toBe(1);

    let result: Task | null | undefined;
    service.getTaskById(1).subscribe((t) => (result = t));
    expect(result).toBeNull();
  });

  it('keeps the change in memory when the API fails', () => {
    service.deleteTask(2).subscribe();
    http.expectOne({ method: 'DELETE', url: `${API}/2` }).error(new ProgressEvent('error'));
    expect(service.tasks().map((t) => t.id)).toEqual([1]);
  });

  it('simulates a creation date for each task, since JSONPlaceholder has none', () => {
    const dates = service.tasks().map((t) => t.createdAt);
    expect(dates.every((d) => !!d)).toBeTrue();
    expect(new Set(dates).size).toBe(dates.length);
  });
});

/** Con el backend propio (`persistentApi`): ids y fechas los pone el servidor. */
describe('TaskService with the own backend (persistentApi)', () => {
  const LOCAL = 'http://localhost:8000/todos';
  const original = { ...environment };
  const stored: Task[] = [
    { id: 1, userId: 1, title: 'uno', completed: false, priority: 'medium', createdAt: '2026-01-01T00:00:01.000Z' },
    { id: 2, userId: 2, title: 'dos', completed: true, priority: 'medium', createdAt: '2026-01-01T00:00:02.000Z' },
  ];
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    environment.apiUrl = 'http://localhost:8000';
    environment.persistentApi = true;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TaskService); // se crea ya con la configuración local
    http.expectOne(LOCAL).flush(stored);
  });

  afterEach(() => {
    http.verify();
    Object.assign(environment, original); // no contaminar al resto de tests
  });

  it('loads from the backend and keeps the creation date it stores (no simulation)', () => {
    expect(service.tasks()).toEqual(stored);
  });

  it('still simulates a date for a task the backend returned without one', () => {
    service.reload();
    http.expectOne(LOCAL).flush([{ id: 5, userId: 1, title: 'sin fecha', completed: false }]);
    expect(service.tasks()[0].createdAt).toBeTruthy();
  });

  it('creates the task with the id and date the server answers, not local ones', () => {
    let created: Task | undefined;
    service.addTask({ title: 'nueva', userId: 1, completed: false, priority: 'medium' }).subscribe((t) => (created = t));
    const req = http.expectOne({ method: 'POST', url: LOCAL });
    expect('id' in req.request.body).toBeFalse(); // el id lo asigna el servidor
    expect(req.request.body).toEqual(jasmine.objectContaining({ title: 'nueva', userId: 1, completed: false }));
    req.flush({ id: 201, userId: 1, title: 'nueva', completed: false, createdAt: '2026-02-02T00:00:00.000Z' });

    expect(created?.id).toBe(201);
    expect(service.tasks()[0]).toEqual(jasmine.objectContaining({ id: 201, createdAt: '2026-02-02T00:00:00.000Z' }));
  });

  it('does not reuse the id of a deleted task: the server decides', () => {
    service.addTask({ title: 'a', userId: 1, completed: false, priority: 'medium' }).subscribe();
    http.expectOne({ method: 'POST', url: LOCAL }).flush({ id: 7, userId: 1, title: 'a', completed: false, createdAt: '2026-02-02T00:00:00.000Z' });
    service.addTask({ title: 'b', userId: 1, completed: false, priority: 'medium' }).subscribe();
    http.expectOne({ method: 'POST', url: LOCAL }).flush({ id: 8, userId: 1, title: 'b', completed: false, createdAt: '2026-02-02T00:00:01.000Z' });
    expect(service.tasks().map((t) => t.id)).toEqual([8, 7, 1, 2]);
  });

  it('updates with a PUT of the whole task and keeps what the server answers', () => {
    service.updateTask({ ...stored[0], completed: true }).subscribe();
    const req = http.expectOne({ method: 'PUT', url: `${LOCAL}/1` });
    expect(req.request.body).toEqual({ ...stored[0], completed: true });
    req.flush({ ...stored[0], completed: true });
    expect(service.tasks()[0].completed).toBeTrue();
  });

  it('propagates the API errors instead of ignoring them', () => {
    let failed = 0;
    service.updateTask({ ...stored[0], title: 'x' }).subscribe({ error: () => failed++ });
    http.expectOne({ method: 'PUT', url: `${LOCAL}/1` }).flush({}, { status: 500, statusText: 'Error' });
    service.deleteTask(1).subscribe({ error: () => failed++ });
    http.expectOne({ method: 'DELETE', url: `${LOCAL}/1` }).flush({}, { status: 404, statusText: 'Not Found' });
    expect(failed).toBe(2);
    expect(service.tasks()).toEqual(stored); // memoria intacta
  });

  it('restores a deleted task recreating it in the backend with its id and date', () => {
    service.deleteTask(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${LOCAL}/1` }).flush(null, { status: 204, statusText: 'No Content' });
    let restored: boolean | undefined;
    service.restoreTask(stored[0], 0).subscribe((r) => (restored = r));
    const req = http.expectOne({ method: 'POST', url: LOCAL });
    expect(req.request.body).toEqual(stored[0]); // su id y su fecha de creación originales
    req.flush(stored[0], { status: 201, statusText: 'Created' });
    expect(restored).toBeTrue();
    expect(service.tasks()).toEqual(stored);
  });
});
