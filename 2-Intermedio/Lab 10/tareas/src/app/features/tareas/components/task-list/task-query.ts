import { Task, TaskFilter, TaskPriorityFilter } from '../../models/task.model';

export type ViewMode = 'cards' | 'list';
export type SortKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'status-pending' | 'status-done';

/** Lo que el usuario puede pedir para acotar y ordenar la lista. */
export interface TaskQuery {
  search: string;
  status: TaskFilter;
  /** Id de usuario, o 'all'. */
  user: number | 'all';
  priority: TaskPriorityFilter;
  sort: SortKey;
}

export const SORTS: readonly { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguas' },
  { value: 'title-asc', label: 'Título A–Z' },
  { value: 'title-desc', label: 'Título Z–A' },
  { value: 'status-pending', label: 'Pendientes primero' },
  { value: 'status-done', label: 'Completadas primero' },
];

export const DEFAULT_SORT: SortKey = 'date-desc';

export const DEFAULT_QUERY: TaskQuery = { search: '', status: 'all', user: 'all', priority: 'all', sort: DEFAULT_SORT };

/** Mínimo de caracteres para que un texto cuente como búsqueda (con menos se ve la lista completa). */
export const MIN_SEARCH_LENGTH = 2;

/** El texto de búsqueda que se aplica de verdad: recortado, o vacío si es demasiado corto. */
export const effectiveSearch = (search: string): string => (search.trim().length >= MIN_SEARCH_LENGTH ? search.trim() : '');

const time = (task: Task) => (task.createdAt ? Date.parse(task.createdAt) : 0);

const COMPARATORS: Record<SortKey, (a: Task, b: Task) => number> = {
  'date-desc': (a, b) => time(b) - time(a),
  'date-asc': (a, b) => time(a) - time(b),
  'title-asc': (a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }),
  'title-desc': (a, b) => b.title.localeCompare(a.title, 'es', { sensitivity: 'base' }),
  'status-pending': (a, b) => Number(a.completed) - Number(b.completed),
  'status-done': (a, b) => Number(b.completed) - Number(a.completed),
};

/** Minúsculas y sin tildes, para que "medico" encuentre "Médico". */
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** ¿Hay algún filtro activo? (el orden no cuenta: no reduce los resultados). */
export const hasActiveFilters = (query: TaskQuery): boolean =>
  effectiveSearch(query.search) !== '' || query.status !== 'all' || query.user !== 'all' || query.priority !== 'all';

/** Filtra por búsqueda, estado, usuario y prioridad, y ordena. No modifica la lista original. */
export function filterAndSort(tasks: readonly Task[], query: TaskQuery): Task[] {
  const text = normalize(query.search.trim());
  const compare = COMPARATORS[query.sort];
  return tasks
    .filter(
      (task) =>
        (query.user === 'all' || task.userId === query.user) &&
        (query.priority === 'all' || task.priority === query.priority) &&
        (query.status === 'all' || (query.status === 'completed') === task.completed) &&
        (text === '' || normalize(task.title).includes(text)),
    )
    .sort((a, b) => compare(a, b) || a.id - b.id); // desempate estable por id
}
