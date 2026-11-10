import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, TaskDraft } from '../models/task.model';
import { InMemoryResource } from './in-memory-resource';

/**
 * Tareas de JSONPlaceholder (`/todos`), con el estado en memoria. Ver `InMemoryResource`
 * para la carga, la búsqueda por id y cómo se tratan las escrituras simuladas.
 */
@Injectable({ providedIn: 'root' })
export class TaskService extends InMemoryResource<Task> {
  protected readonly apiUrl = 'https://jsonplaceholder.typicode.com/todos';

  readonly tasks = this.items;

  constructor() {
    super();
    this.reload();
  }

  getTaskById(id: number): Observable<Task | null> {
    return this.getById(id);
  }

  /** Las nuevas van arriba. Se ignora el id de la respuesta (la API siempre devuelve 201). */
  addTask(draft: TaskDraft): Observable<Task> {
    return this.addItem({ ...draft, id: this.nextId(), createdAt: new Date().toISOString() }, 'start');
  }

  updateTask(task: Task): Observable<Task> {
    return this.updateItem(task);
  }

  deleteTask(id: number): Observable<void> {
    return this.deleteItem(id);
  }

  /** Reinserta una tarea borrada en su posición original (para "Deshacer"). */
  restoreTask(task: Task, index: number): boolean {
    return this.restoreItem(task, index);
  }

  /** La API no trae fecha de creación: se simula una distinta por tarea para poder mostrarla. */
  protected override prepare(tasks: Task[]): Task[] {
    const now = Date.now();
    return tasks.map((task) => ({ ...task, createdAt: new Date(now - task.id * 60_000).toISOString() }));
  }
}
