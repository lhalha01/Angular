import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { errorYaNotificado } from '@core/http/error-notificado';
import { HasUnsavedChanges } from '@core/guards/unsaved-changes.guard';
import { TaskDraft } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { ToastService } from '@core/services/toast.service';
import { TaskFormComponent } from '../task-form/task-form.component';

/** Ruta `/add-task`. Protegida por `unsavedChangesGuard`. */
@Component({
  selector: 'app-add-task',
  imports: [TaskFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card card--narrow">
      <p class="eyebrow">Nueva tarea</p>
      <h2>Crear tarea</h2>
      <app-task-form submitLabel="Guardar tarea" (saved)="create($event)" (cancelled)="back()" />
    </section>
  `,
})
export class AddTaskComponent implements HasUnsavedChanges {
  private readonly tasks = inject(TaskService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly form = viewChild.required(TaskFormComponent);

  hasUnsavedChanges(): boolean {
    return this.form().hasUnsavedChanges();
  }

  protected create(draft: TaskDraft): void {
    this.tasks.addTask(draft).subscribe({
      next: (task) => {
        this.toast.show(`Tarea #${task.id} creada`);
        this.back();
      },
      // El aviso del error lo muestra el interceptor; el formulario se queda como está para poder reintentar.
      error: errorYaNotificado,
    });
  }

  protected back(): void {
    this.router.navigate(['/tasks']);
  }
}
