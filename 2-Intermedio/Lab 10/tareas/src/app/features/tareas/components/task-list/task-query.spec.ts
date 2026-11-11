import { Task } from '../../models/task.model';
import { DEFAULT_QUERY, effectiveSearch, filterAndSort, hasActiveFilters, normalize, TaskQuery } from './task-query';

const TASKS: Task[] = [
  { id: 1, userId: 1, title: 'Comprar pan', completed: true, priority: 'medium', createdAt: '2024-01-03T00:00:00Z' },
  { id: 2, userId: 1, title: 'Llamar al médico', completed: false, priority: 'medium', createdAt: '2024-01-02T00:00:00Z' },
  { id: 3, userId: 2, title: 'Estudiar Angular', completed: true, priority: 'medium', createdAt: '2024-01-01T00:00:00Z' },
];
const ids = (tasks: Task[]) => tasks.map((t) => t.id);
const query = (patch: Partial<TaskQuery>): TaskQuery => ({ ...DEFAULT_QUERY, ...patch });

describe('task-query', () => {
  describe('normalize', () => {
    it('lowercases and removes accents', () => expect(normalize('MÉDICO Álvaro')).toBe('medico alvaro'));
  });

  describe('filterAndSort', () => {
    it('returns everything by default, most recent first', () => {
      expect(ids(filterAndSort(TASKS, DEFAULT_QUERY))).toEqual([1, 2, 3]);
    });

    it('searches by title ignoring case and accents', () => {
      expect(ids(filterAndSort(TASKS, query({ search: 'MEDICO' })))).toEqual([2]);
    });

    it('ignores surrounding spaces in the search', () => {
      expect(ids(filterAndSort(TASKS, query({ search: '  pan ' })))).toEqual([1]);
    });

    it('filters by status', () => {
      expect(ids(filterAndSort(TASKS, query({ status: 'completed' })))).toEqual([1, 3]);
      expect(ids(filterAndSort(TASKS, query({ status: 'pending' })))).toEqual([2]);
    });

    it('filters by user', () => {
      expect(ids(filterAndSort(TASKS, query({ user: 2 })))).toEqual([3]);
    });

    it('combines all the filters', () => {
      expect(ids(filterAndSort(TASKS, query({ user: 1, status: 'pending', search: 'llamar' })))).toEqual([2]);
      expect(filterAndSort(TASKS, query({ user: 2, status: 'pending' }))).toEqual([]);
    });

    it('sorts by date, title and status', () => {
      expect(ids(filterAndSort(TASKS, query({ sort: 'date-asc' })))).toEqual([3, 2, 1]);
      expect(ids(filterAndSort(TASKS, query({ sort: 'title-asc' })))).toEqual([1, 3, 2]);
      expect(ids(filterAndSort(TASKS, query({ sort: 'title-desc' })))).toEqual([2, 3, 1]);
      expect(filterAndSort(TASKS, query({ sort: 'status-pending' }))[0].id).toBe(2);
      expect(filterAndSort(TASKS, query({ sort: 'status-done' })).at(-1)?.id).toBe(2);
    });

    it('breaks ties by id', () => {
      const sameDate = TASKS.map((t) => ({ ...t, createdAt: '2024-01-01T00:00:00Z' }));
      expect(ids(filterAndSort(sameDate, DEFAULT_QUERY))).toEqual([1, 2, 3]);
    });

    it('does not modify the original list', () => {
      const original = [...TASKS];
      filterAndSort(TASKS, query({ sort: 'date-asc' }));
      expect(TASKS).toEqual(original);
    });
  });

  describe('hasActiveFilters', () => {
    it('is false for the default query and for a different sort', () => {
      expect(hasActiveFilters(DEFAULT_QUERY)).toBeFalse();
      expect(hasActiveFilters(query({ sort: 'title-asc' }))).toBeFalse();
    });

    it('is true when something narrows the results', () => {
      expect(hasActiveFilters(query({ search: 'pan' }))).toBeTrue();
      expect(hasActiveFilters(query({ status: 'pending' }))).toBeTrue();
      expect(hasActiveFilters(query({ user: 3 }))).toBeTrue();
      expect(hasActiveFilters(query({ priority: 'high' }))).toBeTrue();
    });

    it('ignores a search made only of spaces, or shorter than 2 characters (it is not a search)', () => {
      expect(hasActiveFilters(query({ search: '   ' }))).toBeFalse();
      expect(hasActiveFilters(query({ search: 'x' }))).toBeFalse();
      expect(hasActiveFilters(query({ search: ' x ' }))).toBeFalse();
    });
  });

  describe('effectiveSearch', () => {
    it('trims the text and drops it when it is shorter than 2 characters', () => {
      expect(effectiveSearch('  pan ')).toBe('pan');
      expect(effectiveSearch('p')).toBe('');
      expect(effectiveSearch('   ')).toBe('');
      expect(effectiveSearch('')).toBe('');
    });
  });

  describe('priority filter', () => {
    const withPriority: Task[] = [
      { ...TASKS[0], priority: 'high' },
      { ...TASKS[1], priority: 'low' },
      { ...TASKS[2], priority: 'high' },
    ];

    it('keeps only the tasks with that priority', () => {
      expect(ids(filterAndSort(withPriority, query({ priority: 'high', sort: 'date-asc' })))).toEqual([3, 1]);
      expect(ids(filterAndSort(withPriority, query({ priority: 'low' })))).toEqual([2]);
      expect(ids(filterAndSort(withPriority, query({ priority: 'medium' })))).toEqual([]);
    });

    it('«all» keeps every task, and it combines with the other filters', () => {
      expect(filterAndSort(withPriority, query({ priority: 'all' })).length).toBe(3);
      expect(ids(filterAndSort(withPriority, query({ priority: 'high', status: 'pending' })))).toEqual([]);
      expect(ids(filterAndSort(withPriority, query({ priority: 'high', user: 2 })))).toEqual([3]);
    });
  });
});
