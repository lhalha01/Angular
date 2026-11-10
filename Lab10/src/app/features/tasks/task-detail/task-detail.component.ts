import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { HighlightUserDirective } from '../../../shared/directives/highlight-user.directive';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';

@Component({
  selector: 'app-task-detail',
  imports: [RouterLink, DatePipe, TaskStatusPipe, HighlightUserDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = task();
    @if (t) {
      <section class="card detail">
        <p class="eyebrow">Detalle de tarea</p>
        <h2>{{ t.title }}</h2>
        <div class="row"><span class="label">ID</span><strong>#{{ t.id }}</strong></div>
        <div class="row">
          <span class="label">Usuario</span>
          <strong [appHighlightUser]="userName(t.userId)">{{ userName(t.userId) }}</strong>
        </div>
        <div class="row"><span class="label">Estado</span><strong>{{ t.completed | taskStatus }}</strong></div>
        @if (t.createdAt) {
          <div class="row"><span class="label">Creada</span><strong>{{ t.createdAt | date: 'fullDate' }}</strong></div>
        }

        <div class="actions">
          <a class="btn btn-secondary" routerLink="/tasks">Volver</a>
          <a class="btn btn-primary" [routerLink]="['edit']">Editar</a>
        </div>
      </section>
    } @else if (t === null) {
      <div class="card state">No se encontró la tarea. <a routerLink="/tasks">Volver a la lista</a></div>
    } @else {
      <div class="card state">Cargando tarea...</div>
    }
  `,
  styles: `
    .detail { max-width: 760px; margin: 3rem auto; }
    h2 { font-size: 2rem; margin: 0.4rem 0 1.5rem; }
    .row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid var(--border-soft); color: var(--text-muted); }
    .label { color: var(--text-dim); }
  `,
})
export class TaskDetailComponent {
  private readonly tasks = inject(TaskService);
  private readonly users = inject(UserService);

  /** Llega del parámetro `:id` gracias a withComponentInputBinding(). */
  readonly id = input.required<string>();

  /** `undefined` = cargando, `null` = no existe. */
  protected readonly task = toSignal(
    toObservable(this.id).pipe(switchMap((id) => this.tasks.getTaskById(Number(id)))),
  );

  protected userName(userId: number): string {
    return this.users.nameOf(userId);
  }
}
