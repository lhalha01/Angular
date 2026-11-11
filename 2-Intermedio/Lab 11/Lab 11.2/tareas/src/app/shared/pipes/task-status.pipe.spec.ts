import { TaskStatusPipe } from './task-status.pipe';

describe('TaskStatusPipe', () => {
  const pipe = new TaskStatusPipe();

  it('shows completed tasks', () => expect(pipe.transform(true)).toContain('Completada'));
  it('shows pending tasks', () => expect(pipe.transform(false)).toContain('Pendiente'));
  it('treats null/undefined as pending', () => {
    expect(pipe.transform(null)).toContain('Pendiente');
    expect(pipe.transform(undefined)).toContain('Pendiente');
  });
});
