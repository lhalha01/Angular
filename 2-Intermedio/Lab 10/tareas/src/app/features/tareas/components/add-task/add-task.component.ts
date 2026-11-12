import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, finalize, from } from 'rxjs';
import { HasUnsavedChanges } from '@core/guards/unsaved-changes.guard';
import { TaskDraft } from '../../models/task.model';
import { TasksFacade } from '../../services/tasks.facade';
import { TaskFormComponent } from '../task-form/task-form.component';

/**
 * Ruta `/add-task`. Protegida por `unsavedChangesGuard`.
 *
 * Protección de doble envío: los envíos del formulario pasan por un `Subject` con `exhaustMap`, que ignora los que
 * llegan mientras hay uno en curso (aunque se pulse «Guardar» varias veces, solo se crea una tarea). El flujo se cierra
 * con `takeUntilDestroyed()`; el error HTTP lo avisa el interceptor y no termina el flujo (se captura dentro).
Solo conoce la fachada (`TasksFacade`).
 */
@Component({
  selector: 'app-add-task',
  imports: [TaskFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card card--narrow">
      <p class="eyebrow">Nueva tarea</p>
      <h2>Crear tarea</h2>
      <app-task-form submitLabel="Guardar tarea" [saving]="saving()" (saved)="create($event)" (cancelled)="back()" />
    </section>
  `,
})
export class AddTaskComponent implements HasUnsavedChanges {
  private readonly facade = inject(TasksFacade);
  private readonly router = inject(Router);
  private readonly form = viewChild.required(TaskFormComponent);

  /** Hay un guardado en curso: el formulario desactiva su botón mientras tanto. */
  protected readonly saving = signal(false);

  private readonly create$ = new Subject<TaskDraft>();

  constructor() {
    this.create$
      .pipe(
        exhaustMap((draft) => {
          this.saving.set(true);
          // `create` crea la tarea (la lista la muestra sin recargar) y avisa; si falla, se rechaza.
          return from(this.facade.create(draft)).pipe(
            catchError(() => EMPTY),
            finalize(() => this.saving.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.back());
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
