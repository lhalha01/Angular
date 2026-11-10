import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Task, TaskDraft } from '../models/task.model';

export type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * JSONPlaceholder no persiste los cambios, así que el estado vive en memoria (signal).
 * Las peticiones POST/PUT/DELETE se envían igualmente para practicar, pero el resultado
 * que manda es el local: ni sus respuestas ni sus fallos alteran la lista.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/todos';

  private readonly _tasks = signal<Task[]>([]);
  private readonly _status = signal<LoadStatus>('loading');

  readonly tasks = this._tasks.asReadonly();
  readonly status = this._status.asReadonly();

  constructor() {
    this.reload();
  }

  /** Carga (o recarga) las tareas iniciales desde la API. */
  reload(): void {
    this._status.set('loading');
    this.http.get<Task[]>(this.apiUrl).subscribe({
      next: (tasks) => {
        const now = Date.now();
        // La API no trae fecha: se simula una distinta por tarea para poder mostrarla.
        this._tasks.set(tasks.map((t) => ({ ...t, createdAt: new Date(now - t.id * 60_000).toISOString() })));
        this._status.set('ready');
      },
      error: () => this._status.set('error'),
    });
  }

  /**
   * Devuelve la tarea o `null` si no existe.
   * Una vez cargada la lista, la memoria es la fuente de verdad (así una tarea borrada no
   * "resucita" desde la API); antes de eso, se consulta `/todos/:id` directamente.
   */
  getTaskById(id: number): Observable<Task | null> {
    if (!Number.isInteger(id)) return of(null);
    if (this._status() === 'ready') return of(this._tasks().find((t) => t.id === id) ?? null);
    return this.http.get<Task>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(null)));
  }

  addTask(draft: TaskDraft): Observable<Task> {
    const task: Task = { ...draft, id: this.nextId(), createdAt: new Date().toISOString() };
    return this.http.post<Task>(this.apiUrl, task).pipe(
      catchError(() => of(task)),
      // La API responde siempre con id 201: se ignora su respuesta para no duplicar ids.
      map(() => task),
      tap((created) => this._tasks.update((list) => [created, ...list])),
    );
  }

  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task).pipe(
      catchError(() => of(task)),
      map(() => task),
      tap((updated) => this._tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)))),
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(null)),
      tap(() => this._tasks.update((list) => list.filter((t) => t.id !== id))),
      map(() => undefined),
    );
  }

  /**
   * Reinserta una tarea borrada en su posición original (para "Deshacer").
   * Si su id ya está en uso (p. ej. se creó otra tarea reutilizándolo) no hace nada.
   */
  restoreTask(task: Task, index: number): boolean {
    if (this._tasks().some((t) => t.id === task.id)) return false;
    this._tasks.update((list) => {
      const copy = [...list];
      copy.splice(Math.min(index, copy.length), 0, task);
      return copy;
    });
    return true;
  }

  private nextId(): number {
    return this._tasks().reduce((max, t) => Math.max(max, t.id), 0) + 1;
  }
}
