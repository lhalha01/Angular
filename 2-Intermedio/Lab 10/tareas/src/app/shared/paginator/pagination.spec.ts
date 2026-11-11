import { paginate } from './pagination';

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it('returns the requested page', () => {
    const result = paginate(items, 2, 10);
    expect(result.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(result).toEqual(jasmine.objectContaining({ page: 2, totalPages: 3, firstIndex: 10, total: 25 }));
  });

  it('returns a shorter last page', () => {
    expect(paginate(items, 3, 10).items).toEqual([21, 22, 23, 24, 25]);
  });

  it('clamps a page that is out of range', () => {
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, -4, 10).page).toBe(1);
  });

  it('puts everything on one page with "all"', () => {
    const result = paginate(items, 5, 'all');
    expect(result.items.length).toBe(25);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });

  it('handles an empty list', () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
    expect(result.total).toBe(0);
  });
});
