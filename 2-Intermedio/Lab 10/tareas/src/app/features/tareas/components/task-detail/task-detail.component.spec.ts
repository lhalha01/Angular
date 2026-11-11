import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskDetailComponent } from './task-detail.component';

const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
const TASK: Task = { id: 4, userId: 2, title: 'Estudiar Angular', completed: true, createdAt: '2024-03-05T10:00:00Z' };

describe('TaskDetailComponent', () => {
  function setup(task: Task | null) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    http.expectOne(USERS_URL).flush([{ id: 2, name: 'Ervin Howell', username: 'e', email: 'e@e.com' }]);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows every field of the task', () => {
    const { el } = setup(TASK);
    expect(el.querySelector('h2')?.textContent).toContain('Estudiar Angular');
    const rows = Array.from(el.querySelectorAll('.row')).map((r) => r.textContent?.replace(/\s+/g, ' ').trim());
    expect(rows[0]).toContain('#4');
    expect(rows[1]).toContain('Ervin Howell');
    expect(rows[2]).toContain('Completada');
    expect(rows[3]).toContain('2024'); // fecha en español
  });

  it('highlights the user when the name starts with a vowel', () => {
    expect(setup(TASK).el.querySelector('.user-highlight')?.textContent).toContain('Ervin Howell');
  });

  it('does not show the date when the task has none', () => {
    const { el } = setup({ ...TASK, createdAt: undefined });
    expect(el.querySelectorAll('.row').length).toBe(3);
  });

  it('links back to the list and to the edit page', () => {
    const hrefs = Array.from(setup(TASK).el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/tasks', '/tasks/4/edit']);
  });

  it('shows a "not found" message when there is no task', () => {
    const { el } = setup(null);
    expect(el.querySelector('.state')?.textContent).toContain('No se encontró la tarea');
    expect(el.querySelector('.detail')).toBeNull();
    expect(el.querySelector('.state a')?.getAttribute('href')).toBe('/tasks');
  });
});
