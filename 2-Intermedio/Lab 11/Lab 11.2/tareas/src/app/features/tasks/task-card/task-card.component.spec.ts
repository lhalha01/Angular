import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Task } from '../../../core/models/task.model';
import { TaskCardComponent } from './task-card.component';

const TASK: Task = { id: 7, userId: 2, title: 'Estudiar Angular', completed: false, createdAt: '2024-03-05T10:00:00Z' };

describe('TaskCardComponent', () => {
  function setup(task: Task = TASK, userName = 'Ervin Howell') {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('task', task);
    fixture.componentRef.setInput('userName', userName);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, component: fixture.componentInstance };
  }

  it('shows the task data', () => {
    const { el } = setup();
    expect(el.querySelector('.meta')?.textContent).toContain('#7');
    expect(el.querySelector('h3')?.textContent).toContain('ESTUDIAR ANGULAR');
    expect(el.querySelector('.status')?.textContent).toContain('Pendiente');
    expect(el.textContent).toContain('Ervin Howell');
    expect(el.textContent).toContain('05/03/2024');
  });

  it('links to the detail page', () => {
    const link = setup().el.querySelector<HTMLAnchorElement>('a')!;
    expect(link.getAttribute('href')).toBe('/tasks/7');
  });

  it('highlights users whose name starts with a vowel', () => {
    expect(setup().el.querySelector('.user-highlight')).not.toBeNull(); // Ervin
    TestBed.resetTestingModule();
    expect(setup(TASK, 'Leanne Graham').el.querySelector('.user-highlight')).toBeNull();
  });

  it('reflects a completed task', () => {
    const { el } = setup({ ...TASK, completed: true });
    expect(el.querySelector('.status')?.classList).toContain('completed');
    expect(el.querySelector('.status')?.textContent).toContain('Completada');
  });

  it('switches to the row layout', () => {
    const { fixture, el } = setup();
    expect(el.classList).toContain('card');
    expect(el.classList).not.toContain('card--row');
    fixture.componentRef.setInput('layout', 'row');
    fixture.detectChanges();
    expect(el.classList).toContain('card--row');
  });

  it('emits an event for each action', () => {
    const { el, component } = setup();
    const toggle = jasmine.createSpy('toggle');
    const edit = jasmine.createSpy('edit');
    const remove = jasmine.createSpy('remove');
    component.toggleStatus.subscribe(toggle);
    component.edit.subscribe(edit);
    component.remove.subscribe(remove);

    el.querySelector<HTMLButtonElement>('.status')!.click();
    Array.from(el.querySelectorAll<HTMLButtonElement>('.actions button'))
      .find((b) => b.textContent?.includes('Editar'))!
      .click();
    el.querySelector<HTMLButtonElement>('.btn-danger')!.click();

    expect(toggle).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
