import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../models/task.model';
import { UserService } from '@features/usuarios';
import { HighlightUserDirective } from '@shared/directives/highlight-user.directive';
import { TaskStatusPipe } from '@shared/pipes/task-status.pipe';
import { StateMessageComponent } from '@shared/components/state-message/state-message.component';

/** Ruta hija `/tasks/:id`. La tarea la carga `taskResolver`. */
@Component({
  selector: 'app-task-detail',
  imports: [RouterLink, DatePipe, TaskStatusPipe, HighlightUserDirective, StateMessageComponent],
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
          <a class="btn btn-primary" [routerLink]="['/tasks', t.id, 'edit']">Editar</a>
        </div>
      </section>
    } @else {
      <app-state-message>No se encontró la tarea. <a routerLink="/tasks">Volver a la lista</a></app-state-message>
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
  private readonly users = inject(UserService);

  /** Llega resuelta por la ruta (`null` si el id no existe). */
  readonly task = input.required<Task | null>();

  protected userName(userId: number): string {
    return this.users.nameOf(userId);
  }
}
