import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Priority, PRIORITIES, Task } from '../../models/task.model';
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
        <div class="row"><span class="label">Prioridad</span><strong>{{ priorityLabel(t.priority) }}</strong></div>
        @if (t.description) {
          <div class="row row--text"><span class="label">Descripción</span><p class="description">{{ t.description }}</p></div>
        }
        @if (t.startDate) {
          <div class="row"><span class="label">Inicio</span><strong>{{ t.startDate | date: 'dd/MM/yyyy' }}</strong></div>
        }
        @if (t.endDate) {
          <div class="row"><span class="label">Fin</span><strong>{{ t.endDate | date: 'dd/MM/yyyy' }}</strong></div>
        }
        @if (t.tags?.length) {
          <div class="row">
            <span class="label">Etiquetas</span>
            <span class="tags">@for (tag of t.tags; track tag) { <span class="tag">{{ tag }}</span> }</span>
          </div>
        }
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
    .row--text { align-items: start; }
    .description { margin: 0; max-width: 28rem; text-align: right; white-space: pre-line; color: var(--text); }
    .tags { display: inline-flex; flex-wrap: wrap; gap: 0.3rem; justify-content: flex-end; }
    .tag { padding: 0.05rem 0.55rem; border-radius: 999px; background: var(--btn-secondary-bg); color: var(--btn-secondary-text); font-size: 0.8rem; }
  `,
})
export class TaskDetailComponent {
  private readonly users = inject(UserService);

  /** Llega resuelta por la ruta (`null` si el id no existe). */
  readonly task = input.required<Task | null>();

  protected priorityLabel(priority: Priority): string {
    return PRIORITIES.find((p) => p.value === priority)?.label ?? priority;
  }

  protected userName(userId: number): string {
    return this.users.nameOf(userId);
  }
}
