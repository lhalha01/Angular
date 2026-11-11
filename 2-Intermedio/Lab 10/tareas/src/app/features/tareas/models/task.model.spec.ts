import { isTask } from './task.model';

describe('isTask', () => {
  const valid = { id: 1, userId: 2, title: 'Comprar pan', completed: false };

  it('accepts a task, with or without the local createdAt field', () => {
    expect(isTask(valid)).toBeTrue();
    expect(isTask({ ...valid, createdAt: '2026-01-01T00:00:00.000Z' })).toBeTrue();
  });

  it('rejects values that are not objects', () => {
    for (const value of [null, undefined, 5, 'texto', []]) expect(isTask(value)).toBeFalse();
  });

  it('rejects objects with missing or mistyped fields', () => {
    expect(isTask({ ...valid, id: '1' })).toBeFalse();
    expect(isTask({ ...valid, completed: 'no' })).toBeFalse();
    expect(isTask({ ...valid, createdAt: 5 })).toBeFalse();
    expect(isTask({ id: 1, title: 'sin userId', completed: true })).toBeFalse();
  });
});
