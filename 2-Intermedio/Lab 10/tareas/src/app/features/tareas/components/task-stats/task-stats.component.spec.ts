import { TestBed } from '@angular/core/testing';
import { Priority, Task } from '../../models/task.model';
import { TaskStatsComponent } from './task-stats.component';

const task = (id: number, completed: boolean, priority: Priority): Task => ({ id, userId: 1, title: `t${id}`, completed, priority });

describe('TaskStatsComponent', () => {
  function create(tasks: Task[]) {
    const fixture = TestBed.createComponent(TaskStatsComponent);
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const text = (selector: string) => el.querySelector(selector)?.textContent?.trim();
    return { fixture, el, text };
  }

  it('shows the total, the pending and completed counts and the progress', () => {
    const { text } = create([task(1, true, 'high'), task(2, false, 'medium'), task(3, false, 'low'), task(4, true, 'low')]);
    expect(text('.total')).toBe('4');
    expect(text('.pending')).toBe('2');
    expect(text('.completed')).toBe('2');
    expect(text('.progress')).toBe('50 %');
  });

  it('rounds the progress to a whole percentage', () => {
    expect(create([task(1, true, 'low'), task(2, false, 'low'), task(3, false, 'low')]).text('.progress')).toBe('33 %');
  });

  it('splits the tasks by priority, with bars proportional to the total', () => {
    const { el } = create([task(1, false, 'high'), task(2, false, 'high'), task(3, false, 'medium'), task(4, false, 'low')]);
    const rows = Array.from(el.querySelectorAll('.priorities li')).map((li) => li.textContent?.trim());
    expect(rows).toEqual(['Alta2', 'Media1', 'Baja1']);
    const widths = Array.from(el.querySelectorAll<HTMLElement>('.fill')).map((f) => f.style.width);
    expect(widths).toEqual(['50%', '25%', '25%']);
  });

  it('with no tasks shows zeros and does not divide by zero', () => {
    const { text, el } = create([]);
    expect(text('.total')).toBe('0');
    expect(text('.progress')).toBe('0 %');
    expect(Array.from(el.querySelectorAll<HTMLElement>('.fill')).every((f) => f.style.width === '0%')).toBeTrue();
  });

  it('updates when the tasks change', () => {
    const { fixture, text } = create([task(1, false, 'low')]);
    fixture.componentRef.setInput('tasks', [task(1, true, 'low'), task(2, false, 'low')]);
    fixture.detectChanges();
    expect(text('.total')).toBe('2');
    expect(text('.completed')).toBe('1');
  });
});
