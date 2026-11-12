import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LoadStatus } from '@core/services/in-memory-resource';
import { Task } from '../../models/task.model';
import { TasksFacade } from '../../services/tasks.facade';
import { TaskListComponent } from './task-list.component';

const USERS = 'https://jsonplaceholder.typicode.com/users';
const task = (id: number, completed: boolean): Task => ({ id, userId: 1, title: `Tarea ${id}`, completed, priority: 'medium', createdAt: '2024-01-01T00:00:00Z' });

/** Las estadísticas de la lista van en un bloque `@defer`: no se cargan hasta que entran en pantalla. */
describe('TaskListComponent: estadísticas diferidas (@defer)', () => {
  let tasks: WritableSignal<Task[]>;
  let fixture: ComponentFixture<TaskListComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    localStorage.removeItem('taskView');
    tasks = signal([task(1, true), task(2, false), task(3, false)]);
    const facade = {
      tasks: tasks.asReadonly(),
      status: signal<LoadStatus>('ready').asReadonly(),
      search: () => of([]),
      reload: () => undefined,
      toggleCompleted: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: TasksFacade, useValue: facade }],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
    fixture = TestBed.createComponent(TaskListComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).match(USERS).forEach((r) => r.flush([]));
    fixture.detectChanges();
  });
  afterEach(() => localStorage.removeItem('taskView'));

  const bloque = async () => (await fixture.getDeferBlocks())[0];

  it('al empezar muestra la lista y solo el hueco de las estadísticas', () => {
    expect(el.querySelectorAll('app-task-card').length).toBe(3);
    expect(el.querySelector('app-task-stats')).toBeNull();
    expect(el.querySelector('.stats-skeleton')).not.toBeNull();
  });

  it('muestra «Cargando estadísticas…» mientras se descarga', async () => {
    await (await bloque()).render(DeferBlockState.Loading);
    expect(el.querySelector('.stats-skeleton')?.textContent).toContain('Cargando estadísticas');
    expect(el.querySelector('app-task-stats')).toBeNull();
  });

  it('una vez cargado muestra las estadísticas de todas las tareas y se mantiene al día', async () => {
    await (await bloque()).render(DeferBlockState.Complete);
    expect(el.querySelector('app-task-stats .total')?.textContent?.trim()).toBe('3');
    expect(el.querySelector('app-task-stats .completed')?.textContent?.trim()).toBe('1');

    tasks.update((list) => [...list, task(4, true)]); // un alta, p. ej.
    fixture.detectChanges();
    expect(el.querySelector('app-task-stats .total')?.textContent?.trim()).toBe('4');
    expect(el.querySelector('app-task-stats .completed')?.textContent?.trim()).toBe('2');
  });
});
