import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap } from 'rxjs';
import { HasUnsavedChanges } from '@core/guards/unsaved-changes.guard';
import { TaskDraft } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { ToastService } from '@core/services/toast.service';
import { TaskFormComponent } from '../task-form/task-form.component';

/**
 * Ruta `/add-task`. Protegida por `unsavedChangesGuard`.
 *
 * Protección de doble envío: los envíos del formulario pasan por un `Subject` con `exhaustMap`, que ignora los que
 * llegan mientras hay uno en curso (aunque se pulse «Guardar» varias veces, solo se crea una tarea). El flujo se cierra
 * con `takeUntilDestroyed()`; el error HTTP lo avisa el interceptor y no termina el flujo (se captura dentro).
 */
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

  private readonly create$ = new Subject<TaskDraft>();

  constructor() {
    this.create$
      .pipe(
        exhaustMap((draft) => this.tasks.addTask(draft).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(),
      )
      .subscribe((task) => {
        this.toast.show(`Tarea #${task.id} creada`);
        this.back();
      });
  }

  hasUnsavedChanges(): boolean {
    return this.form().hasUnsavedChanges();
  }

  protected create(draft: TaskDraft): void {
    this.create$.next(draft);
  }

  protected back(): void {
    this.router.navigate(['/tasks']);
  }
}
