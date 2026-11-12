import { inject, Injectable } from '@angular/core';
import { errorYaNotificado } from '@core/http/error-notificado';
import { ConfirmService } from '@core/services/confirm.service';
import { ToastService } from '@core/services/toast.service';
import { lastValueFrom, Observable } from 'rxjs';
import { Task, TaskDraft } from '../models/task.model';
import { TaskStateService } from './task-state.service';
import { TaskService } from './task.service';

/**
 * Lo único que los componentes de `tareas` conocen del estado y de los datos. Expone las señales de solo lectura de
 * `TaskStateService` y reúne las operaciones: cargar, buscar, crear, actualizar, cambiar el estado y eliminar (con
 * confirmación, aviso y «Deshacer»). Los componentes no importan `TaskService` ni `TaskStateService` (lo comprueba una
 * regla de ESLint).
 *
 * Crear, actualizar y eliminar actualizan la vista sin volver a pedir la lista: la modificación se aplica en memoria al
 * responder el servidor. Los errores HTTP los avisa el interceptor; aquí solo se rechazan las promesas o se ignoran.
 */
@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private readonly state = inject(TaskStateService);
  private readonly service = inject(TaskService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  // Estado (solo lectura para los componentes)
  readonly tasks = this.state.tasks;
  readonly status = this.state.status;
  readonly pending = this.state.pending;
  readonly completed = this.state.completed;
  readonly total = this.state.total;

  /** Vuelve a pedir las tareas a la API (p. ej. «Reintentar» tras un error de carga). */
  reload(): void {
    this.service.reload();
  }

  /** La tarea con ese id, o `null` si no existe (para el resolver de las rutas de detalle y edición). */
  getById(id: number): Observable<Task | null> {
    return this.service.getTaskById(id);
  }

  /** Busca por título en la API; devuelve las coincidencias tal como están en el servidor. */
  search(term: string): Observable<Task[]> {
    return this.service.search(term);
  }

  /** Crea la tarea (queda arriba en la lista, sin recargar) y avisa. Si falla, se rechaza (lo avisa el interceptor). */
  async create(draft: TaskDraft): Promise<Task> {
    const created = await lastValueFrom(this.service.addTask(draft));
    this.toast.show(`Tarea #${created.id} creada`);
    return created;
  }

  /** Guarda los cambios de la tarea y avisa. Si falla, se rechaza (lo avisa el interceptor). */
  async update(task: Task): Promise<Task> {
    const saved = await lastValueFrom(this.service.updateTask(task));
    this.toast.show(`Tarea #${task.id} actualizada`);
    return saved;
  }

  /** Pasa la tarea de pendiente a completada (o al revés), previa confirmación. */
  async toggleCompleted(task: Task): Promise<void> {
    const target = task.completed ? 'pendiente' : 'completada';
    const accepted = await this.confirm.ask({
      title: 'Cambiar estado',
      message: `¿Marcar "${task.title}" como ${target}?`,
      confirmLabel: `Marcar como ${target}`,
    });
    if (!accepted) return;
    this.service.updateTask({ ...task, completed: !task.completed }, 'No se pudo cambiar el estado de la tarea').subscribe({
      next: () => this.toast.show(`Tarea #${task.id} marcada como ${target}`),
      error: errorYaNotificado, // lo avisa el interceptor de errores
    });
  }

  /** Elimina la tarea, previa confirmación, y ofrece deshacerlo durante unos segundos. */
  async remove(task: Task): Promise<void> {
    const accepted = await this.confirm.ask({
      title: 'Eliminar tarea',
      message: `¿Seguro que quieres eliminar "${task.title}"?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!accepted) return;

    const index = this.state.tasks().findIndex((t) => t.id === task.id);
    this.service.deleteTask(task.id).subscribe({
      next: () =>
        this.toast.show(`Tarea #${task.id} eliminada`, {
          actionLabel: 'Deshacer',
          duration: 8000,
          action: () => this.undo(task, index),
        }),
      error: errorYaNotificado,
    });
  }

  /** «Deshacer»: con el backend propio recrea la tarea allí, con su mismo id y su fecha. */
  private undo(task: Task, index: number): void {
    this.service.restoreTask(task, index).subscribe({
      next: (restored) =>
        this.toast.show(restored ? `Tarea #${task.id} restaurada` : 'No se pudo restaurar: el id ya está en uso'),
      error: errorYaNotificado,
    });
  }
}
