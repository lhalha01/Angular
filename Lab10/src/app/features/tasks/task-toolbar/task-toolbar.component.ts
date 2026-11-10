import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskFilter } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { DEFAULT_SORT, SORTS, SortKey, ViewMode } from '../task-list/task-query';

/**
 * Barra superior de la lista: búsqueda, filtros, orden y modo de vista.
 * Cada control es un `model()`, así que el padre se enlaza con `[(search)]="…"`.
 */
@Component({
  selector: 'app-task-toolbar',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters">
      <label class="filter filter--search">
        Buscar por título
        <input type="search" placeholder="Escribe para buscar..." [ngModel]="search()" (ngModelChange)="search.set($event)" />
      </label>

      <label class="filter">
        Filtrar por estado
        <select [ngModel]="status()" (ngModelChange)="status.set($event)">
          <option value="all">Todos</option>
          <option value="completed">Completadas</option>
          <option value="pending">Pendientes</option>
        </select>
      </label>

      <label class="filter">
        Filtrar por usuario
        <select [ngModel]="user()" (ngModelChange)="user.set($event)">
          <option [ngValue]="'all'">Todos</option>
          @for (u of users(); track u.id) {
            <option [ngValue]="u.id">{{ u.name }}</option>
          }
        </select>
      </label>

      <label class="filter">
        Ordenar por
        <select [ngModel]="sort()" (ngModelChange)="sort.set($event)">
          @for (s of sorts; track s.value) {
            <option [ngValue]="s.value">{{ s.label }}</option>
          }
        </select>
      </label>

      <div class="view-toggle" role="group" aria-label="Modo de visualización">
        <button type="button" [class.active]="view() === 'cards'" [attr.aria-pressed]="view() === 'cards'" (click)="view.set('cards')">▦ Marcos</button>
        <button type="button" [class.active]="view() === 'list'" [attr.aria-pressed]="view() === 'list'" (click)="view.set('list')">☰ Lista</button>
      </div>
    </div>
  `,
  styles: `
    .filters { display: flex; gap: 1rem; flex-wrap: wrap; align-items: end; }
    .filter { display: flex; flex-direction: column; gap: 0.4rem; color: var(--text-muted); font-size: 0.9rem; }
    .filter--search { min-width: 220px; }
    .view-toggle { display: inline-flex; border: 1px solid var(--input-border); border-radius: 0.75rem; overflow: hidden; }
    .view-toggle button { border: none; background: var(--input-bg); color: var(--text-muted); padding: 0.75rem 0.9rem; cursor: pointer; font-weight: 600; }
    .view-toggle button + button { border-left: 1px solid var(--input-border); }
    .view-toggle button.active { background: var(--btn-secondary-bg); color: var(--btn-secondary-text); }
  `,
})
export class TaskToolbarComponent {
  readonly users = input<readonly User[]>([]);

  readonly search = model('');
  readonly status = model<TaskFilter>('all');
  /** Id de usuario, o 'all'. */
  readonly user = model<number | 'all'>('all');
  readonly sort = model<SortKey>(DEFAULT_SORT);
  readonly view = model<ViewMode>('cards');

  protected readonly sorts = SORTS;
}
