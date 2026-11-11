import { ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, OnInit, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Task, TaskFilter } from '../../../core/models/task.model';
import { StorageService } from '../../../core/services/storage.service';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { PaginatorComponent } from '../../../shared/paginator/paginator.component';
import { PageSize, paginate } from '../../../shared/paginator/pagination';
import { StateMessageComponent } from '../../../shared/state-message/state-message.component';
import { TaskActions } from '../task-actions.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskToolbarComponent } from '../task-toolbar/task-toolbar.component';
import { DEFAULT_LIST_STATE, readParams, toParams } from './task-list-params';
import { filterAndSort, hasActiveFilters, SortKey, TaskQuery, ViewMode } from './task-query';

const VIEW_KEY = 'taskView';
const VIEWS: readonly ViewMode[] = ['cards', 'list'];

/**
 * Pantalla de la lista. Solo orquesta: guarda el estado de la consulta (filtros, orden,
 * página), lo sincroniza con la URL y delega el resto en piezas pequeñas:
 * lógica pura en `task-query` / `paginate`, y presentación en la barra, la tarjeta y el paginador.
 */
@Component({
  selector: 'app-task-list',
  imports: [RouterLink, TaskToolbarComponent, TaskCardComponent, PaginatorComponent, StateMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="topbar">
        <div>
          <p class="eyebrow">Lista de tareas</p>
          <h2>Tu tablero</h2>
        </div>

        <app-task-toolbar
          [users]="users()"
          [(search)]="search"
          [(status)]="status"
          [(user)]="user"
          [(sort)]="sort"
          [(view)]="view"
        />
      </div>

      @switch (loadStatus()) {
        @case ('loading') {
          <app-state-message>Cargando tareas...</app-state-message>
        }
        @case ('error') {
          <app-state-message kind="error">
            No se pudieron cargar las tareas.
            <div class="actions"><button type="button" class="btn btn-secondary" (click)="retry()">Reintentar</button></div>
          </app-state-message>
        }
        @default {
          @if (allTasks().length === 0) {
            <app-state-message>
              Aún no hay tareas.
              <div class="actions"><a class="btn btn-primary" routerLink="/add-task">Crear tarea</a></div>
            </app-state-message>
          } @else if (filtered().length === 0) {
            <app-state-message>
              Ninguna tarea coincide con los filtros.
              <div class="actions"><button type="button" class="btn btn-secondary" (click)="clearFilters()">Limpiar filtros</button></div>
            </app-state-message>
          } @else {
            <div class="count-row">
              <p class="count" aria-live="polite">{{ rangeLabel() }}</p>
              @if (filtersActive()) {
                <button type="button" class="link" (click)="clearFilters()">Limpiar filtros</button>
              }
            </div>

            <div class="task-list" [class.task-list--rows]="view() === 'list'">
              @for (task of paged().items; track task.id) {
                <app-task-card
                  [task]="task"
                  [userName]="userName(task.userId)"
                  [layout]="view() === 'list' ? 'row' : 'card'"
                  (toggleStatus)="actions.toggleCompleted(task)"
                  (edit)="edit(task)"
                  (remove)="actions.remove(task)"
                />
              }
            </div>

            <app-paginator [page]="paged().page" (pageChange)="page.set($event)" [(pageSize)]="pageSize" [totalPages]="paged().totalPages" />
          }
        }
      }
    </section>
  `,
  styles: `
    .panel { max-width: 1100px; margin: 2.5rem auto; padding: 1.5rem; }
    .topbar { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    h2 { margin: 0.35rem 0 0; font-size: 2rem; }
    .count-row { display: flex; align-items: center; gap: 1rem; margin: 0 0 0.75rem; flex-wrap: wrap; }
    .count { color: var(--text-dim); font-size: 0.9rem; margin: 0; }
    .link { border: none; background: none; padding: 0; color: var(--accent-text); font-weight: 600; cursor: pointer; text-decoration: underline; }
    .task-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
    .task-list--rows { grid-template-columns: 1fr; gap: 0.6rem; }
  `,
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(StorageService);
  protected readonly actions = inject(TaskActions);

  protected readonly loadStatus = this.taskService.status;
  protected readonly allTasks = this.taskService.tasks;
  protected readonly users = this.userService.users;

  // Estado de la consulta (cada señal se enlaza con la barra de filtros mediante [(…)]).
  // Parte de los valores por defecto; `ngOnInit` los sustituye por los de la URL.
  protected readonly search = signal(DEFAULT_LIST_STATE.search);
  protected readonly status = signal<TaskFilter>(DEFAULT_LIST_STATE.status);
  protected readonly user = signal<number | 'all'>(DEFAULT_LIST_STATE.user);
  protected readonly sort = signal<SortKey>(DEFAULT_LIST_STATE.sort);
  protected readonly pageSize = signal<PageSize>(DEFAULT_LIST_STATE.pageSize);
  protected readonly view = signal<ViewMode>(this.storage.getOneOf(VIEW_KEY, VIEWS) ?? 'cards');

  private readonly query = computed<TaskQuery>(() => ({
    search: this.search(),
    status: this.status(),
    user: this.user(),
    sort: this.sort(),
  }));

  /** Vuelve a la página 1 cada vez que cambia la consulta o el tamaño de página. */
  protected readonly page = linkedSignal<{ query: TaskQuery; size: PageSize }, number>({
    source: () => ({ query: this.query(), size: this.pageSize() }),
    computation: () => 1,
  });

  protected readonly filtered = computed(() => filterAndSort(this.allTasks(), this.query()));
  protected readonly paged = computed(() => paginate(this.filtered(), this.page(), this.pageSize()));
  protected readonly filtersActive = computed(() => hasActiveFilters(this.query()));

  protected readonly rangeLabel = computed(() => {
    const { firstIndex, items, total } = this.paged();
    const range = `Mostrando ${firstIndex + 1}–${firstIndex + items.length} de ${total} tareas`;
    return this.filtersActive() ? `${range} (filtradas de ${this.allTasks().length})` : range;
  });

  constructor() {
    // Refleja el estado en la URL con replaceUrl (sin ensuciar el historial). No se vuelve
    // a leer: una navegación en vuelo podría pisar lo que el usuario sigue escribiendo.
    effect(() => {
      const queryParams = toParams({ ...this.query(), pageSize: this.pageSize(), page: this.page() });
      untracked(() => this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true }));
    });

    // Se recuerda la vista elegida entre sesiones.
    effect(() => this.storage.set(VIEW_KEY, this.view()));
  }

  /**
   * La URL manda al entrar: se lee una vez aquí y después solo se escribe. Va en `ngOnInit`
   * (y no en el constructor) porque necesita la ruta ya activada. La página se fija la
   * última, porque cambiar cualquier filtro la devuelve a 1.
   */
  ngOnInit(): void {
    const initial = readParams(this.route.snapshot.queryParamMap);
    this.search.set(initial.search);
    this.status.set(initial.status);
    this.user.set(initial.user);
    this.sort.set(initial.sort);
    this.pageSize.set(initial.pageSize);
    this.page.set(initial.page);
  }

  protected userName(userId: number): string {
    return this.userService.nameOf(userId);
  }

  /** Quita búsqueda, estado y usuario (se conservan orden, tamaño de página y vista). */
  protected clearFilters(): void {
    this.search.set('');
    this.status.set('all');
    this.user.set('all');
  }

  protected edit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  protected retry(): void {
    this.taskService.reload();
  }
}
