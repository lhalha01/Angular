import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Task, TaskFilter } from '../../../core/models/task.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { HighlightUserDirective } from '../../../shared/directives/highlight-user.directive';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';

type ViewMode = 'cards' | 'list';
type PageSize = number | 'all';
type SortKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'status-pending' | 'status-done';

const VIEW_KEY = 'taskView';
/** Opciones del selector "Por página"; 'all' muestra todos los resultados. */
const PAGE_SIZES: readonly PageSize[] = [10, 25, 50, 100, 'all'];
const DEFAULT_PAGE_SIZE: PageSize = 10;

const SORTS: readonly { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguas' },
  { value: 'title-asc', label: 'Título A–Z' },
  { value: 'title-desc', label: 'Título Z–A' },
  { value: 'status-pending', label: 'Pendientes primero' },
  { value: 'status-done', label: 'Completadas primero' },
];
const DEFAULT_SORT: SortKey = 'date-desc';

const time = (t: Task) => (t.createdAt ? Date.parse(t.createdAt) : 0);
const COMPARATORS: Record<SortKey, (a: Task, b: Task) => number> = {
  'date-desc': (a, b) => time(b) - time(a),
  'date-asc': (a, b) => time(a) - time(b),
  'title-asc': (a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }),
  'title-desc': (a, b) => b.title.localeCompare(a.title, 'es', { sensitivity: 'base' }),
  'status-pending': (a, b) => Number(a.completed) - Number(b.completed),
  'status-done': (a, b) => Number(b.completed) - Number(a.completed),
};

/** Minúsculas y sin tildes, para que "tarea" encuentre "Tárea". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

@Component({
  selector: 'app-task-list',
  imports: [FormsModule, RouterLink, HighlightUserDirective, TaskStatusPipe, UpperCasePipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="topbar">
        <div>
          <p class="eyebrow">Lista de tareas</p>
          <h2>Tu tablero</h2>
        </div>

        <div class="filters">
          <label class="filter filter--search">
            Buscar por título
            <input type="search" placeholder="Escribe para buscar..." [ngModel]="search()" (ngModelChange)="onSearch($event)" />
          </label>

          <label class="filter">
            Filtrar por estado
            <select [ngModel]="filter()" (ngModelChange)="onStatus($event)">
              <option value="all">Todos</option>
              <option value="completed">Completadas</option>
              <option value="pending">Pendientes</option>
            </select>
          </label>

          <label class="filter">
            Filtrar por usuario
            <select [ngModel]="userFilter()" (ngModelChange)="onUser($event)">
              <option [ngValue]="'all'">Todos</option>
              @for (u of users(); track u.id) {
                <option [ngValue]="u.id">{{ u.name }}</option>
              }
            </select>
          </label>

          <label class="filter">
            Ordenar por
            <select [ngModel]="sort()" (ngModelChange)="onSort($event)">
              @for (s of sorts; track s.value) {
                <option [ngValue]="s.value">{{ s.label }}</option>
              }
            </select>
          </label>

          <div class="view-toggle" role="group" aria-label="Modo de visualización">
            <button type="button" [class.active]="viewMode() === 'cards'" [attr.aria-pressed]="viewMode() === 'cards'" (click)="setView('cards')">▦ Marcos</button>
            <button type="button" [class.active]="viewMode() === 'list'" [attr.aria-pressed]="viewMode() === 'list'" (click)="setView('list')">☰ Lista</button>
          </div>
        </div>
      </div>

      @switch (status()) {
        @case ('loading') {
          <div class="card state">Cargando tareas...</div>
        }
        @case ('error') {
          <div class="card state">
            No se pudieron cargar las tareas.
            <div class="actions"><button class="btn btn-secondary" (click)="retry()">Reintentar</button></div>
          </div>
        }
        @default {
          @if (allTasks().length === 0) {
            <div class="card state">
              Aún no hay tareas.
              <div class="actions"><a class="btn btn-primary" routerLink="/add-task">Crear tarea</a></div>
            </div>
          } @else if (filteredTasks().length === 0) {
            <div class="card state">
              Ninguna tarea coincide con los filtros.
              <div class="actions"><button class="btn btn-secondary" (click)="clearFilters()">Limpiar filtros</button></div>
            </div>
          } @else {
            <div class="count-row">
              <p class="count" aria-live="polite">{{ rangeLabel() }}</p>
              @if (hasFilters()) {
                <button type="button" class="link" (click)="clearFilters()">Limpiar filtros</button>
              }
            </div>

            <div class="task-list" [class.task-list--rows]="viewMode() === 'list'">
              @for (task of pagedTasks(); track task.id) {
                <article class="card">
                  <div class="task-header">
                    <div>
                      <p class="meta">#{{ task.id }} · Usuario {{ task.userId }}</p>
                      <h3>{{ task.title | uppercase }}</h3>
                    </div>
                    <button
                      type="button"
                      class="status"
                      [class.completed]="task.completed"
                      [title]="task.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
                      (click)="toggleCompleted(task)"
                    >
                      {{ task.completed | taskStatus }}
                    </button>
                  </div>

                  <div class="task-body">
                    <p>Responsable: <span [appHighlightUser]="userName(task.userId)">{{ userName(task.userId) }}</span></p>
                    <p>Creada: {{ task.createdAt | date: 'dd/MM/yyyy' }}</p>
                  </div>

                  <div class="actions">
                    <a class="btn btn-secondary" [routerLink]="[task.id]">Ver detalle</a>
                    <button class="btn btn-secondary" (click)="edit(task)">Editar</button>
                    <button class="btn btn-danger" (click)="remove(task)">Eliminar</button>
                  </div>
                </article>
              }
            </div>

            <div class="pagination">
              <label class="page-size">
                Por página
                <select [ngModel]="pageSize()" (ngModelChange)="onPageSize($event)">
                  @for (size of pageSizes; track size) {
                    <option [ngValue]="size">{{ size === 'all' ? 'Todos' : size }}</option>
                  }
                </select>
              </label>

              @if (totalPages() > 1) {
                <nav class="pager" aria-label="Paginación">
                  <button class="btn btn-secondary" [disabled]="currentPage() === 1" (click)="goTo(currentPage() - 1)">‹ Anterior</button>
                  <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
                  <button class="btn btn-secondary" [disabled]="currentPage() === totalPages()" (click)="goTo(currentPage() + 1)">Siguiente ›</button>
                </nav>
              }
            </div>
          }
        }
      }
    </section>
  `,
  styles: `
    .panel { max-width: 1100px; margin: 2.5rem auto; padding: 1.5rem; }
    .topbar { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    h2 { margin: 0.35rem 0 0; font-size: 2rem; }
    .filters { display: flex; gap: 1rem; flex-wrap: wrap; align-items: end; }
    .view-toggle { display: inline-flex; border: 1px solid var(--input-border); border-radius: 0.75rem; overflow: hidden; }
    .view-toggle button { border: none; background: var(--input-bg); color: var(--text-muted); padding: 0.75rem 0.9rem; cursor: pointer; font-weight: 600; }
    .view-toggle button + button { border-left: 1px solid var(--input-border); }
    .view-toggle button.active { background: var(--btn-secondary-bg); color: var(--btn-secondary-text); }
    .filter { display: flex; flex-direction: column; gap: 0.4rem; color: var(--text-muted); font-size: 0.9rem; }
    .filter--search { min-width: 220px; }
    .count-row { display: flex; align-items: center; gap: 1rem; margin: 0 0 0.75rem; flex-wrap: wrap; }
    .count { color: var(--text-dim); font-size: 0.9rem; margin: 0; }
    .link { border: none; background: none; padding: 0; color: var(--accent-text); font-weight: 600; cursor: pointer; text-decoration: underline; }
    .task-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
    /* Modo lista: una fila por tarea, reutilizando el mismo marcado. */
    .task-list--rows { grid-template-columns: 1fr; gap: 0.6rem; }
    .task-list--rows .card { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; padding: 0.75rem 1rem; }
    .task-list--rows .task-header { flex: 1 1 280px; align-items: center; }
    .task-list--rows .meta { margin: 0 0 0.1rem; }
    .task-list--rows h3 { font-size: 1rem; }
    .task-list--rows .task-body { margin: 0; flex: 0 1 260px; }
    .task-list--rows .actions { margin: 0; }
    .task-header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    .meta { color: var(--meta-text); margin: 0 0 0.4rem; }
    h3 { margin: 0; color: var(--text-strong); }
    .status { display: inline-block; border: none; cursor: pointer; padding: 0.4rem 0.7rem; border-radius: 999px; background: var(--pending-bg); color: var(--pending-text); font-size: 0.76rem; font-weight: 700; white-space: nowrap; }
    .status.completed { background: var(--done-bg); color: var(--done-text); }
    .status:hover { filter: brightness(1.15); }
    .task-body { margin-top: 1rem; color: var(--text-muted); }
    .task-body p { margin: 0.25rem 0; }
    .state .actions { justify-content: center; }
    .pagination { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 1rem 2rem; margin-top: 1.5rem; color: var(--text-muted); }
    .page-size { display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; }
    .page-size select { padding: 0.5rem 0.7rem; }
    .pager { display: flex; align-items: center; gap: 1rem; }
  `,
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly status = this.taskService.status;
  protected readonly allTasks = this.taskService.tasks;
  protected readonly users = this.userService.users;
  protected readonly sorts = SORTS;
  protected readonly pageSizes = PAGE_SIZES;

  protected readonly viewMode = signal<ViewMode>(this.savedView());
  protected readonly search = signal('');
  protected readonly filter = signal<TaskFilter>('all');
  /** Id de usuario o 'all'. */
  protected readonly userFilter = signal<number | 'all'>('all');
  protected readonly sort = signal<SortKey>(DEFAULT_SORT);
  protected readonly pageSize = signal<PageSize>(DEFAULT_PAGE_SIZE);
  protected readonly page = signal(1);

  /** Aplica a la vez búsqueda, estado y usuario, y ordena el resultado. */
  protected readonly filteredTasks = computed(() => {
    const query = normalize(this.search().trim());
    const user = this.userFilter();
    const status = this.filter();
    const compare = COMPARATORS[this.sort()];
    return this.allTasks()
      .filter(
        (t) =>
          (user === 'all' || t.userId === user) &&
          (status === 'all' || (status === 'completed') === t.completed) &&
          (query === '' || normalize(t.title).includes(query)),
      )
      .sort((a, b) => compare(a, b) || a.id - b.id); // desempate estable por id
  });

  protected readonly hasFilters = computed(
    () => this.search().trim() !== '' || this.filter() !== 'all' || this.userFilter() !== 'all',
  );

  /** Tamaño efectivo: con 'all' cabe todo el resultado en una sola página. */
  private readonly size = computed(() => {
    const size = this.pageSize();
    return size === 'all' ? Math.max(1, this.filteredTasks().length) : size;
  });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredTasks().length / this.size())));
  /** Se acota para que borrar la última tarea de una página no deje una página vacía. */
  protected readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  protected readonly pagedTasks = computed(() => {
    const start = (this.currentPage() - 1) * this.size();
    return this.filteredTasks().slice(start, start + this.size());
  });
  protected readonly rangeLabel = computed(() => {
    const total = this.filteredTasks().length;
    const start = (this.currentPage() - 1) * this.size() + 1;
    const range = `Mostrando ${start}–${start + this.pagedTasks().length - 1} de ${total} tareas`;
    return this.hasFilters() ? `${range} (filtradas de ${this.allTasks().length})` : range;
  });

  constructor() {
    this.readQueryParams();
    // El estado de los filtros vive en la URL: se puede recargar, volver atrás desde un
    // detalle o compartir el enlace. Solo se LEE al entrar; después la URL se escribe
    // con replaceUrl (sin ensuciar el historial) y no se vuelve a leer, para que una
    // navegación en vuelo no pise lo que el usuario sigue escribiendo.
    effect(() => {
      const queryParams = {
        q: this.search().trim() || null,
        estado: this.filter() === 'all' ? null : this.filter(),
        usuario: this.userFilter() === 'all' ? null : this.userFilter(),
        orden: this.sort() === DEFAULT_SORT ? null : this.sort(),
        tam: this.pageSize() === DEFAULT_PAGE_SIZE ? null : this.pageSize(),
        pag: this.page() > 1 ? this.page() : null,
      };
      untracked(() => this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true }));
    });
  }

  // Al cambiar un filtro, el orden o el tamaño se vuelve a la primera página.
  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected onStatus(value: TaskFilter): void {
    this.filter.set(value);
    this.page.set(1);
  }

  protected onUser(value: number | 'all'): void {
    this.userFilter.set(value);
    this.page.set(1);
  }

  protected onSort(value: SortKey): void {
    this.sort.set(value);
    this.page.set(1);
  }

  protected onPageSize(value: PageSize): void {
    this.pageSize.set(value);
    this.page.set(1);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  /** Quita búsqueda, estado y usuario (se conservan orden, tamaño de página y vista). */
  protected clearFilters(): void {
    this.search.set('');
    this.filter.set('all');
    this.userFilter.set('all');
    this.page.set(1);
  }

  protected userName(userId: number): string {
    return this.userService.nameOf(userId);
  }

  protected setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      // Sin almacenamiento: la elección solo dura la sesión.
    }
  }

  protected edit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  /** Cambia completada/pendiente, pidiendo confirmación antes. */
  protected async toggleCompleted(task: Task): Promise<void> {
    const target = task.completed ? 'pendiente' : 'completada';
    const accepted = await this.confirm.ask({
      title: 'Cambiar estado',
      message: `¿Marcar "${task.title}" como ${target}?`,
      confirmLabel: `Marcar como ${target}`,
    });
    if (!accepted) return;
    this.taskService.updateTask({ ...task, completed: !task.completed }).subscribe(() => {
      this.toast.show(`Tarea #${task.id} marcada como ${target}`);
    });
  }

  protected async remove(task: Task): Promise<void> {
    // Confirmación explícita antes de una acción destructiva.
    const accepted = await this.confirm.ask({
      title: 'Eliminar tarea',
      message: `¿Seguro que quieres eliminar "${task.title}"?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!accepted) return;
    const index = this.taskService.tasks().findIndex((t) => t.id === task.id);
    this.taskService.deleteTask(task.id).subscribe(() => {
      this.toast.show(`Tarea #${task.id} eliminada`, {
        actionLabel: 'Deshacer',
        duration: 8000,
        action: () => {
          if (this.taskService.restoreTask(task, index)) this.toast.show(`Tarea #${task.id} restaurada`);
          else this.toast.show('No se pudo restaurar: el id ya está en uso');
        },
      });
    });
  }

  protected retry(): void {
    this.taskService.reload();
  }

  /** Lee los filtros de la URL al entrar, ignorando valores inválidos. */
  private readQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;

    this.search.set(params.get('q') ?? '');

    const status = params.get('estado');
    if (status === 'completed' || status === 'pending') this.filter.set(status);

    const user = Number(params.get('usuario'));
    if (params.has('usuario') && Number.isInteger(user) && user > 0) this.userFilter.set(user);

    const sort = SORTS.find((s) => s.value === params.get('orden'));
    if (sort) this.sort.set(sort.value);

    const size = params.get('tam') === 'all' ? 'all' : Number(params.get('tam'));
    if (PAGE_SIZES.includes(size)) this.pageSize.set(size);

    const page = Number(params.get('pag'));
    if (Number.isInteger(page) && page > 1) this.page.set(page);
  }

  private savedView(): ViewMode {
    try {
      return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards';
    } catch {
      return 'cards';
    }
  }
}
