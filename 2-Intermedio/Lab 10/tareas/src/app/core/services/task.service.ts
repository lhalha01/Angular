import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskDraft, isTask } from '../../models/task.model';
import { InMemoryResource } from './in-memory-resource';

/**
 * Tareas (`/todos`), con el estado en memoria: de JSONPlaceholder por defecto, o del backend
 * propio en la configuración `local`. Ver `InMemoryResource` para la carga, la búsqueda por id y
 * cómo se tratan las escrituras en cada caso.
 */
@Injectable({ providedIn: 'root' })
export class TaskService extends InMemoryResource<Task> {
  protected readonly apiUrl = `${environment.apiUrl}/todos`;

  protected override isItem = isTask;

  readonly tasks = this.items;

  constructor() {
    super();
    this.reload();
  }

  getTaskById(id: number): Observable<Task | null> {
    return this.getById(id);
  }

  /**
   * Las nuevas van arriba. Con JSONPlaceholder se ignora el id de la respuesta (siempre devuelve
   * 201) y se genera uno local; con el backend propio el id lo asigna el servidor.
   */
  addTask(draft: TaskDraft): Observable<Task> {
    return this.addItem({ ...draft, id: this.nextId(), createdAt: new Date().toISOString() }, 'start');
  }

  updateTask(task: Task): Observable<Task> {
    return this.updateItem(task);
  }

  deleteTask(id: number): Observable<void> {
    return this.deleteItem(id);
  }

  /**
   * Reinserta una tarea borrada en su posición original (para "Deshacer"). Emite `false` si su id
   * ya está en uso.
   */
  restoreTask(task: Task, index: number): Observable<boolean> {
    return this.restoreItem(task, index);
  }

  /**
   * JSONPlaceholder no trae fecha de creación: se simula una distinta por tarea para poder
   * mostrarla. El backend propio sí la guarda, y entonces se respeta.
   */
  protected override prepare(tasks: Task[]): Task[] {
    const now = Date.now();
    return tasks.map((task) => ({
      ...task,
      createdAt: task.createdAt ?? new Date(now - task.id * 60_000).toISOString(),
    }));
  }
}
