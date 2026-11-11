import { Task, TaskFilter } from '../../../models/task.model';

export type ViewMode = 'cards' | 'list';
export type SortKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'status-pending' | 'status-done';

/** Lo que el usuario puede pedir para acotar y ordenar la lista. */
export interface TaskQuery {
  search: string;
  status: TaskFilter;
  /** Id de usuario, o 'all'. */
  user: number | 'all';
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

export const DEFAULT_QUERY: TaskQuery = { search: '', status: 'all', user: 'all', sort: DEFAULT_SORT };

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
  query.search.trim() !== '' || query.status !== 'all' || query.user !== 'all';

/** Filtra por búsqueda, estado y usuario, y ordena. No modifica la lista original. */
export function filterAndSort(tasks: readonly Task[], query: TaskQuery): Task[] {
  const text = normalize(query.search.trim());
  const compare = COMPARATORS[query.sort];
  return tasks
    .filter(
      (task) =>
        (query.user === 'all' || task.userId === query.user) &&
        (query.status === 'all' || (query.status === 'completed') === task.completed) &&
        (text === '' || normalize(task.title).includes(text)),
    )
    .sort((a, b) => compare(a, b) || a.id - b.id); // desempate estable por id
}
