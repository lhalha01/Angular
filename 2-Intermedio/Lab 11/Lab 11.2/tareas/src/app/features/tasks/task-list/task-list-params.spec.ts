import { convertToParamMap } from '@angular/router';
import { DEFAULT_LIST_STATE, ListState, readParams, toParams } from './task-list-params';

const read = (params: Record<string, string>) => readParams(convertToParamMap(params));

describe('task-list-params', () => {
  describe('readParams', () => {
    it('returns the defaults for an empty URL', () => {
      expect(read({})).toEqual(DEFAULT_LIST_STATE);
    });

    it('reads every supported parameter', () => {
      expect(read({ q: 'pan', estado: 'pending', usuario: '3', orden: 'title-asc', tam: '25', pag: '4' })).toEqual({
        search: 'pan',
        status: 'pending',
        user: 3,
        sort: 'title-asc',
        pageSize: 25,
        page: 4,
      });
    });

    it('reads the "all" page size', () => {
      expect(read({ tam: 'all' }).pageSize).toBe('all');
    });

    it('ignores invalid values', () => {
      expect(read({ estado: 'nada', usuario: 'abc', orden: 'raro', tam: '7', pag: '-3' })).toEqual(DEFAULT_LIST_STATE);
      expect(read({ usuario: '0' }).user).toBe('all');
      expect(read({ usuario: '1.5' }).user).toBe('all');
      expect(read({ pag: 'x' }).page).toBe(1);
    });
  });

  describe('toParams', () => {
    it('omits everything that has its default value', () => {
      expect(toParams(DEFAULT_LIST_STATE)).toEqual({
        q: null,
        estado: null,
        usuario: null,
        orden: null,
        tam: null,
        pag: null,
      });
    });

    it('writes what differs from the defaults', () => {
      const state: ListState = { search: ' pan ', status: 'completed', user: 2, sort: 'date-asc', pageSize: 'all', page: 3 };
      expect(toParams(state)).toEqual({ q: 'pan', estado: 'completed', usuario: 2, orden: 'date-asc', tam: 'all', pag: 3 });
    });

    it('round-trips through readParams', () => {
      const state: ListState = { search: 'x', status: 'pending', user: 5, sort: 'status-done', pageSize: 50, page: 2 };
      const params = Object.fromEntries(
        Object.entries(toParams(state))
          .filter(([, v]) => v !== null)
          .map(([k, v]) => [k, String(v)]),
      );
      expect(read(params)).toEqual(state);
    });
  });
});
