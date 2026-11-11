import { isTask } from './task.model';

describe('isTask: planificación (Lab 16.2)', () => {
  const valid = { id: 1, userId: 2, title: 'Comprar pan', completed: false, priority: 'medium' };

  it('acepta una tarea sin planificación y con ella', () => {
    expect(isTask(valid)).toBeTrue();
    expect(isTask({ ...valid, description: 'x', startDate: '2026-03-01', endDate: '2026-03-02', tags: ['a', 'b'] })).toBeTrue();
    expect(isTask({ ...valid, tags: [] })).toBeTrue();
  });

  it('rechaza una planificación con el tipo equivocado', () => {
    expect(isTask({ ...valid, description: 5 })).toBeFalse();
    expect(isTask({ ...valid, startDate: 20260301 })).toBeFalse();
    expect(isTask({ ...valid, endDate: null })).toBeFalse();
    expect(isTask({ ...valid, tags: 'demo' })).toBeFalse();
    expect(isTask({ ...valid, tags: ['a', 3] })).toBeFalse();
  });
});
