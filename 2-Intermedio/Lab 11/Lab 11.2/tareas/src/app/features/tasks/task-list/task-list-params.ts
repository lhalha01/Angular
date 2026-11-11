import { ParamMap, Params } from '@angular/router';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, PageSize } from '../../../shared/paginator/pagination';
import { DEFAULT_QUERY, DEFAULT_SORT, SORTS, TaskQuery } from './task-query';

/** Todo lo que se guarda en la URL de la lista. */
export interface ListState extends TaskQuery {
  pageSize: PageSize;
  page: number;
}

export const DEFAULT_LIST_STATE: ListState = { ...DEFAULT_QUERY, pageSize: DEFAULT_PAGE_SIZE, page: 1 };

/** Lee el estado de la URL (`?q=…&estado=…`). Los valores inválidos se ignoran. */
export function readParams(params: ParamMap): ListState {
  const state: ListState = { ...DEFAULT_LIST_STATE };

  state.search = params.get('q') ?? '';

  const status = params.get('estado');
  if (status === 'completed' || status === 'pending') state.status = status;

  const user = Number(params.get('usuario'));
  if (params.has('usuario') && Number.isInteger(user) && user > 0) state.user = user;

  const sort = SORTS.find((s) => s.value === params.get('orden'));
  if (sort) state.sort = sort.value;

  const size = params.get('tam') === 'all' ? 'all' : Number(params.get('tam'));
  if (PAGE_SIZES.includes(size)) state.pageSize = size;

  const page = Number(params.get('pag'));
  if (Number.isInteger(page) && page > 1) state.page = page;

  return state;
}

/** Convierte el estado en parámetros de URL; lo que vale el valor por defecto se omite (`null`). */
export function toParams(state: ListState): Params {
  return {
    q: state.search.trim() || null,
    estado: state.status === 'all' ? null : state.status,
    usuario: state.user === 'all' ? null : state.user,
    orden: state.sort === DEFAULT_SORT ? null : state.sort,
    tam: state.pageSize === DEFAULT_PAGE_SIZE ? null : state.pageSize,
    pag: state.page > 1 ? state.page : null,
  };
}
