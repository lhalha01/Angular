import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Task, TaskDraft } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { TaskFormComponent } from '../task-form/task-form.component';

/** Ruta hija `/tasks/:id/edit`. */
@Component({
  selector: 'app-task-edit',
  imports: [TaskFormComponent, RouterLink],
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
          (cancelled)="cancel(t)"
        />
      </section>
    } @else if (t === null) {
      <div class="card state">
        No se encontró la tarea. <a routerLink="/tasks">Volver a la lista</a>
      </div>
    } @else {
      <div class="card state">Cargando tarea...</div>
    }
  `,
})
export class TaskEditComponent {
  private readonly tasks = inject(TaskService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Llega del parámetro `:id` gracias a withComponentInputBinding(). */
  readonly id = input.required<string>();

  /** `undefined` = cargando, `null` = no existe. */
  protected readonly task = toSignal(
    toObservable(this.id).pipe(switchMap((id) => this.tasks.getTaskById(Number(id)))),
  );

  protected save(task: Task, draft: TaskDraft): void {
    this.tasks.updateTask({ ...task, ...draft }).subscribe(() => {
      this.toast.show(`Tarea #${task.id} actualizada`);
      this.router.navigate(['/tasks', task.id]);
    });
  }

  protected cancel(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }
}
