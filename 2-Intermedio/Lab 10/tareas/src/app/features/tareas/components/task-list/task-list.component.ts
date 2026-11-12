import { ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, OnInit, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, scan, startWith, switchMap } from 'rxjs';
import { Task, TaskFilter, TaskPriorityFilter } from '../../models/task.model';
import { StorageService } from '@core/services/storage.service';
import { TasksFacade } from '../../services/tasks.facade';
import { UserService } from '@features/usuarios';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { PageSize, paginate } from '@shared/components/paginator/pagination';
import { StateMessageComponent } from '@shared/components/state-message/state-message.component';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskToolbarComponent } from '../task-toolbar/task-toolbar.component';
import { DEFAULT_LIST_STATE, readParams, toParams } from './task-list-params';
import { effectiveSearch, filterAndSort, hasActiveFilters, SortKey, TaskQuery, ViewMode } from './task-query';

/** Resultado de la búsqueda en la API: `ids` son las tareas que coinciden, o `null` si no hay búsqueda que aplicar. */
interface SearchState {
  status: 'idle' | 'searching' | 'done' | 'error';
  ids: ReadonlySet<number> | null;
}

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
          [(priority)]="priority"
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
              <p class="count" aria-live="polite">{{ rangeLabel() }}@if (searchState().status === 'searching') { · buscando… } @else if (searchState().status === 'error') { · no se pudo buscar }</p>
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
                  (toggleStatus)="facade.toggleCompleted(task)"
                  (edit)="edit(task)"
                  (remove)="facade.remove(task)"
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
  protected readonly facade = inject(TasksFacade);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(StorageService);

  protected readonly loadStatus = this.facade.status;
  protected readonly allTasks = this.facade.tasks;
  protected readonly users = this.userService.users;

  // Estado de la consulta (cada señal se enlaza con la barra de filtros mediante [(…)]).
  // Parte de los valores por defecto; `ngOnInit` los sustituye por los de la URL.
  protected readonly search = signal(DEFAULT_LIST_STATE.search);
  protected readonly status = signal<TaskFilter>(DEFAULT_LIST_STATE.status);
  protected readonly user = signal<number | 'all'>(DEFAULT_LIST_STATE.user);
  protected readonly priority = signal<TaskPriorityFilter>(DEFAULT_LIST_STATE.priority);
  protected readonly sort = signal<SortKey>(DEFAULT_LIST_STATE.sort);
  protected readonly pageSize = signal<PageSize>(DEFAULT_LIST_STATE.pageSize);
  protected readonly view = signal<ViewMode>(this.storage.getOneOf(VIEW_KEY, VIEWS) ?? 'cards');

  private readonly query = computed<TaskQuery>(() => ({
    search: this.search(),
    status: this.status(),
    user: this.user(),
    priority: this.priority(),
    sort: this.sort(),
  }));

  /**
   * Búsqueda reactiva. El texto se recorta y, si es demasiado corto, equivale a no buscar; se espera 300 ms a que el
   * usuario deje de teclear (`debounceTime`), no se repite el mismo término (`distinctUntilChanged`) y, si llega otro
   * con una búsqueda en vuelo, esa se cancela (`switchMap`). Busca la API (`/todos?q=`); el resultado son los ids de
   * las tareas que coinciden. Mientras llega una búsqueda nueva se conservan los ids de la anterior (la lista no parpadea).
   */
  protected readonly searchState = toSignal(
    toObservable(this.search).pipe(
      map((text) => effectiveSearch(text)),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) =>
        term === ''
          ? of<SearchState>({ status: 'idle', ids: null })
          : this.facade.search(term).pipe(
              map((tasks): SearchState => ({ status: 'done', ids: new Set(tasks.map((t) => t.id)) })),
              catchError(() => of<SearchState>({ status: 'error', ids: null })), // el aviso lo da el interceptor
              startWith<SearchState>({ status: 'searching', ids: null }),
            ),
      ),
      scan((anterior, actual): SearchState => (actual.status === 'searching' ? { ...actual, ids: anterior.ids } : actual)),
    ),
    { initialValue: { status: 'idle', ids: null } as SearchState },
  );

  /** Vuelve a la página 1 cada vez que cambia la consulta o el tamaño de página. */
  protected readonly page = linkedSignal<{ query: TaskQuery; size: PageSize }, number>({
    source: () => ({ query: this.query(), size: this.pageSize() }),
    computation: () => 1,
  });

  /** Las tareas de la API que coinciden con la búsqueda, cruzadas por id con las que hay en memoria (que son las que mandan). */
  private readonly searched = computed(() => {
    const ids = this.searchState().ids;
    return ids === null ? this.allTasks() : this.allTasks().filter((task) => ids.has(task.id));
  });

  /** El texto lo aplica la API (arriba); aquí solo se filtra por estado, usuario y prioridad, y se ordena. */
  protected readonly filtered = computed(() => filterAndSort(this.searched(), { ...this.query(), search: '' }));
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
    this.priority.set(initial.priority);
    this.sort.set(initial.sort);
    this.pageSize.set(initial.pageSize);
    this.page.set(initial.page);
  }

  protected userName(userId: number): string {
    return this.userService.nameOf(userId);
  }

  /** Quita búsqueda, estado, usuario y prioridad (se conservan orden, tamaño de página y vista). */
  protected clearFilters(): void {
    this.search.set('');
    this.status.set('all');
    this.user.set('all');
    this.priority.set('all');
  }

  protected edit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  protected retry(): void {
    this.facade.reload();
  }
}
