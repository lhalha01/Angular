import { inject, Injectable } from '@angular/core';
import { describeApiError } from '../../core/api-error';
import { Task } from '../../core/models/task.model';
import { ConfirmService } from '../../core/services/confirm.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Acciones de usuario sobre una tarea que combinan varios servicios:
 * pedir confirmación, modificar los datos y avisar del resultado.
 */
@Injectable({ providedIn: 'root' })
export class TaskActions {
  private readonly tasks = inject(TaskService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** Pasa la tarea de pendiente a completada (o al revés), previa confirmación. */
  async toggleCompleted(task: Task): Promise<void> {
    const target = task.completed ? 'pendiente' : 'completada';
    const accepted = await this.confirm.ask({
      title: 'Cambiar estado',
      message: `¿Marcar "${task.title}" como ${target}?`,
      confirmLabel: `Marcar como ${target}`,
    });
    if (!accepted) return;
    this.tasks.updateTask({ ...task, completed: !task.completed }).subscribe({
      next: () => this.toast.show(`Tarea #${task.id} marcada como ${target}`),
      // Los errores de la API solo llegan con el backend propio (la pública los ignora).
      error: (error: unknown) => this.toast.show(describeApiError(error, 'No se pudo cambiar el estado de la tarea')),
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

    const index = this.tasks.tasks().findIndex((t) => t.id === task.id);
    this.tasks.deleteTask(task.id).subscribe({
      next: () =>
        this.toast.show(`Tarea #${task.id} eliminada`, {
          actionLabel: 'Deshacer',
          duration: 8000,
          action: () => this.undo(task, index),
        }),
      error: (error: unknown) => this.toast.show(describeApiError(error, 'No se pudo eliminar la tarea')),
    });
  }

  /** "Deshacer": con el backend propio recrea la tarea allí, con su mismo id y su fecha. */
  private undo(task: Task, index: number): void {
    this.tasks.restoreTask(task, index).subscribe({
      next: (restored) =>
        this.toast.show(restored ? `Tarea #${task.id} restaurada` : 'No se pudo restaurar: el id ya está en uso'),
      error: (error: unknown) => this.toast.show(describeApiError(error, 'No se pudo restaurar la tarea')),
    });
  }
}
