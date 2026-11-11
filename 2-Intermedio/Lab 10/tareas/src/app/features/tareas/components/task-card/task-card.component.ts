import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRIORITIES, Task } from '../../models/task.model';
import { HighlightUserDirective } from '@shared/directives/highlight-user.directive';
import { TaskStatusPipe } from '@shared/pipes/task-status.pipe';

/**
 * Presenta una tarea, como tarjeta o como fila. Es un componente "tonto": no conoce los
 * servicios; recibe los datos por `input()` y avisa de lo que el usuario pide con `output()`.
 */
@Component({
  selector: 'app-task-card',
  imports: [RouterLink, DatePipe, UpperCasePipe, TaskStatusPipe, HighlightUserDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card', '[class.card--row]': 'layout() === "row"' },
  template: `
    @let t = task();
    <div class="task-header">
      <div>
        <p class="meta">#{{ t.id }} · Usuario {{ t.userId }}</p>
        <h3>{{ t.title | uppercase }}</h3>
      </div>
      <button
        type="button"
        class="status"
        [class.completed]="t.completed"
        [title]="t.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
        (click)="toggleStatus.emit()"
      >
        {{ t.completed | taskStatus }}
      </button>
    </div>

    <div class="task-body">
      <p>Responsable: <span [appHighlightUser]="userName()">{{ userName() }}</span></p>
      <p>Creada: {{ t.createdAt | date: 'dd/MM/yyyy' }}</p>
      <p>Prioridad: <span class="priority priority--{{ t.priority }}">{{ priorityLabel() }}</span></p>
    </div>

    <div class="actions">
      <a class="btn btn-secondary" [routerLink]="['/tasks', t.id]">Ver detalle</a>
      <button type="button" class="btn btn-secondary" (click)="edit.emit()">Editar</button>
      <button type="button" class="btn btn-danger" (click)="remove.emit()">Eliminar</button>
    </div>
  `,
  styles: `
    :host { display: block; }
    .task-header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    .meta { color: var(--meta-text); margin: 0 0 0.4rem; }
    h3 { margin: 0; color: var(--text-strong); }
    .status { display: inline-block; border: none; cursor: pointer; padding: 0.4rem 0.7rem; border-radius: 999px; background: var(--pending-bg); color: var(--pending-text); font-size: 0.76rem; font-weight: 700; white-space: nowrap; }
    .status.completed { background: var(--done-bg); color: var(--done-text); }
    .status:hover { filter: brightness(1.15); }
    .task-body { margin-top: 1rem; color: var(--text-muted); }
    .task-body p { margin: 0.25rem 0; }
    .priority { display: inline-block; padding: 0.1rem 0.55rem; border-radius: 999px; color: #fff; font-size: 0.78rem; font-weight: 700; }
    .priority--high { background: #b91c1c; }
    .priority--medium { background: #b45309; }
    .priority--low { background: #15803d; }

    /* Modo fila: la misma tarjeta, repartida en horizontal. */
    :host(.card--row) { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; padding: 0.75rem 1rem; }
    :host(.card--row) .task-header { flex: 1 1 280px; align-items: center; }
    :host(.card--row) .meta { margin: 0 0 0.1rem; }
    :host(.card--row) h3 { font-size: 1rem; }
    :host(.card--row) .task-body { margin: 0; flex: 0 1 260px; }
    :host(.card--row) .actions { margin: 0; }
  `,
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  /** Nombre ya resuelto del responsable (la tarjeta no conoce el servicio de usuarios). */
  readonly userName = input.required<string>();
  readonly layout = input<'card' | 'row'>('card');

  protected readonly priorityLabel = computed(() => PRIORITIES.find((p) => p.value === this.task().priority)?.label ?? '');

  readonly toggleStatus = output<void>();
  readonly edit = output<void>();
  readonly remove = output<void>();
}
