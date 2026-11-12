import { computed, inject, Injectable } from '@angular/core';
import { TaskService } from './task.service';

/**
 * Estado de las tareas para la aplicación: lo que se lee, en solo lectura, y lo que se deriva de ello con `computed()`.
 *
 * Las tareas, el estado de la carga y sus modificaciones en memoria siguen viviendo en `TaskService` (la base
 * `InMemoryResource`, que ya aplica cada alta, cambio o baja a su `signal` cuando el servidor responde); este servicio no
 * las duplica (habría dos fuentes de verdad) sino que las expone y calcula `pending`, `completed` y `total`. Lo usa
 * `TasksFacade`; los componentes no lo importan.
 */
@Injectable({ providedIn: 'root' })
export class TaskStateService {
  private readonly source = inject(TaskService);

  /** Todas las tareas, tal como están en memoria. */
  readonly tasks = this.source.tasks;
  /** Estado de la carga: `loading`, `ready` o `error`. */
  readonly status = this.source.status;

  readonly pending = computed(() => this.tasks().filter((task) => !task.completed));
  readonly completed = computed(() => this.tasks().filter((task) => task.completed));
  readonly total = computed(() => this.tasks().length);
}
