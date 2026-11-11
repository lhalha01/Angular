import { ChangeDetectionStrategy, Component, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, finalize, map } from 'rxjs';
import { HasUnsavedChanges } from '@core/guards/unsaved-changes.guard';
import { Task, TaskDraft } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { ToastService } from '@core/services/toast.service';
import { StateMessageComponent } from '@shared/components/state-message/state-message.component';
import { TaskFormComponent } from '../task-form/task-form.component';

/**
 * Ruta hija `/tasks/:id/edit`. La tarea la carga `taskResolver`; protegida por `unsavedChangesGuard`.
 * Como en `AddTaskComponent`, los envíos pasan por un `Subject` con `exhaustMap` (sin doble guardado) y se cierran con
 * `takeUntilDestroyed()`; el error HTTP lo avisa el interceptor y el formulario se queda como está para reintentar.
 */
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
          [saving]="saving()"
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

  /** Hay un guardado en curso: el formulario desactiva su botón mientras tanto. */
  protected readonly saving = signal(false);

  private readonly save$ = new Subject<Task>();

  constructor() {
    this.save$
      .pipe(
        exhaustMap((task) => {
          this.saving.set(true);
          return this.tasks.updateTask(task).pipe(
            map(() => task),
            catchError(() => EMPTY),
            finalize(() => this.saving.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((task) => {
        this.toast.show(`Tarea #${task.id} actualizada`);
        this.back(task);
      });
  }

  hasUnsavedChanges(): boolean {
    return this.form()?.hasUnsavedChanges() ?? false;
  }

  protected save(task: Task, draft: TaskDraft): void {
    this.save$.next({ ...task, ...draft });
  }

  protected back(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }
}
