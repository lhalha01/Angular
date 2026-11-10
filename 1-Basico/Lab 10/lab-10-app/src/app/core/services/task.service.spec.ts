import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task } from '../models/task.model';
import { TaskService } from './task.service';

const API = 'https://jsonplaceholder.typicode.com/todos';
const seed: Task[] = [
  { id: 1, userId: 1, title: 'uno', completed: false },
  { id: 2, userId: 2, title: 'dos', completed: true },
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
    service.addTask({ title: 'a', userId: 1, completed: false }).subscribe();
    http.expectOne({ method: 'POST', url: API }).flush({ id: 201 });
    service.addTask({ title: 'b', userId: 1, completed: false }).subscribe();
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
});
