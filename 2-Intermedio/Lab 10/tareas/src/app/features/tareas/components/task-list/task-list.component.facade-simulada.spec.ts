import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LoadStatus } from '@core/services/in-memory-resource';
import { Task } from '../../models/task.model';
import { TasksFacade } from '../../services/tasks.facade';
import { TaskListComponent } from './task-list.component';

const USERS = 'https://jsonplaceholder.typicode.com/users';
const TASK: Task = { id: 1, userId: 1, title: 'Tarea de prueba', completed: false, priority: 'medium', createdAt: '2024-01-01T00:00:00Z' };

/**
 * La lista aislada: la fachada se sustituye por un doble con señales que controla el test, de modo que se prueba solo lo
 * que hace el componente con ella (leer sus señales y llamar a sus métodos). Solo el servicio de usuarios usa HTTP simulado.
 * (El otro archivo de pruebas, `task-list.component.spec.ts`, la prueba con la fachada y el servicio reales.)
 */
describe('TaskListComponent con la fachada simulada', () => {
  let tasks: WritableSignal<Task[]>;
  let status: WritableSignal<LoadStatus>;
  let facade: { tasks: unknown; status: unknown; search: jasmine.Spy; reload: jasmine.Spy; toggleCompleted: jasmine.Spy; remove: jasmine.Spy };
  let fixture: ComponentFixture<TaskListComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    localStorage.removeItem('taskView');
    tasks = signal([TASK]);
    status = signal<LoadStatus>('ready');
    facade = {
      tasks: tasks.asReadonly(),
      status: status.asReadonly(),
      search: jasmine.createSpy('search').and.returnValue(of([])),
      reload: jasmine.createSpy('reload'),
      toggleCompleted: jasmine.createSpy('toggleCompleted').and.resolveTo(),
      remove: jasmine.createSpy('remove').and.resolveTo(),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: TasksFacade, useValue: facade }],
    });
    fixture = TestBed.createComponent(TaskListComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).match(USERS).forEach((r) => r.flush([{ id: 1, name: 'Leanne', username: 'l', email: 'l@l.com' }]));
    fixture.detectChanges();
  });
  afterEach(() => localStorage.removeItem('taskView'));

  it('muestra las tareas que da la fachada', () => {
    expect(el.textContent?.toLowerCase()).toContain('tarea de prueba'); // el título se muestra en mayúsculas
    expect(el.querySelectorAll('app-task-card').length).toBe(1);
  });

  it('se actualiza cuando cambia la señal de la fachada (crear o eliminar una tarea)', () => {
    tasks.set([TASK, { ...TASK, id: 2, title: 'Otra tarea' }]);
    fixture.detectChanges();
    expect(el.textContent?.toLowerCase()).toContain('otra tarea');
    tasks.set([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Aún no hay tareas');
  });

  it('muestra el estado de carga y el de error con «Reintentar», que llama a reload()', () => {
    status.set('loading');
    fixture.detectChanges();
    expect(el.querySelector('app-task-card')).toBeNull();
    status.set('error');
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.state button')!.click();
    expect(facade.reload).toHaveBeenCalledTimes(1);
  });

  it('«Eliminar» de una tarjeta se delega en la fachada', () => {
    const botones = Array.from(el.querySelectorAll<HTMLButtonElement>('app-task-card button'));
    botones.find((b) => b.textContent?.trim() === 'Eliminar')!.click();
    expect(facade.remove).toHaveBeenCalledOnceWith(TASK);
  });
});
