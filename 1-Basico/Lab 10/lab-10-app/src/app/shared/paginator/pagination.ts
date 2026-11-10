/** Tamaño de página: un número de elementos, o 'all' para mostrarlos todos. */
export type PageSize = number | 'all';

export const PAGE_SIZES: readonly PageSize[] = [10, 25, 50, 100, 'all'];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

export interface Page<T> {
  /** Elementos de la página actual. */
  items: T[];
  /** Página actual, ya acotada a [1, totalPages]. */
  page: number;
  totalPages: number;
  /** Posición (base 0) del primer elemento de la página en la lista completa. */
  firstIndex: number;
  /** Total de elementos en la lista completa. */
  total: number;
}

/**
 * Recorta una lista a una página. Es una función pura: la `page` pedida se acota, de modo
 * que borrar el último elemento de la última página no deja una página vacía.
 */
export function paginate<T>(items: readonly T[], page: number, pageSize: PageSize): Page<T> {
  const size = pageSize === 'all' ? Math.max(1, items.length) : Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), totalPages);
  const firstIndex = (current - 1) * size;
  return { items: items.slice(firstIndex, firstIndex + size), page: current, totalPages, firstIndex, total: items.length };
}
