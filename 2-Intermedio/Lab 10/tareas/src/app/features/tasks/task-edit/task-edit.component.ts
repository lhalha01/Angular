import { ChangeDetectionStrategy, Component, inject, input, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { describeApiError } from '../../../core/api-error';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { Task, TaskDraft } from '../../../models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { StateMessageComponent } from '../../../shared/state-message/state-message.component';
import { TaskFormComponent } from '../task-form/task-form.component';

/** Ruta hija `/tasks/:id/edit`. La tarea la carga `taskResolver`; protegida por `unsavedChangesGuard`. */
@Component({
  selector: 'app-task-edit',
  imports: [TaskFormComponent, RouterLink, StateMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = task();
    @if (t) {
      <section class="card card--narrow">
        <p class="eyebrow">Editar tarea #{{ t.id }}</p>
        <h2>Actualizar</h2>
        <app-task-form
          [value]="t"
          submitLabel="Guardar cambios"
          (saved)="save(t, $event)"
          (cancelled)="back(t)"
        />
      </section>
    } @else {
      <app-state-message>No se encontró la tarea. <a routerLink="/tasks">Volver a la lista</a></app-state-message>
    }
  `,
})
export class TaskEditComponent implements HasUnsavedChanges {
  private readonly tasks = inject(TaskService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  /** No existe si la tarea no se ha encontrado (se muestra el mensaje en su lugar). */
  private readonly form = viewChild(TaskFormComponent);

  /** Llega resuelta por la ruta (`null` si el id no existe). */
  readonly task = input.required<Task | null>();

  hasUnsavedChanges(): boolean {
    return this.form()?.hasUnsavedChanges() ?? false;
  }

  protected save(task: Task, draft: TaskDraft): void {
    this.tasks.updateTask({ ...task, ...draft }).subscribe({
      next: () => {
        this.toast.show(`Tarea #${task.id} actualizada`);
        this.back(task);
      },
      // Solo ocurre con el backend propio. El formulario se queda como está para reintentar.
      error: (error: unknown) => this.toast.show(describeApiError(error, 'No se pudo actualizar la tarea')),
    });
  }

  protected back(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }
}
