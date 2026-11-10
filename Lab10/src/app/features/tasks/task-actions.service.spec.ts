import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task } from '../../core/models/task.model';
import { ConfirmService } from '../../core/services/confirm.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { TaskActions } from './task-actions.service';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const SEED: Task[] = [
  { id: 1, userId: 1, title: 'uno', completed: false },
  { id: 2, userId: 1, title: 'dos', completed: true },
  { id: 3, userId: 2, title: 'tres', completed: false },
];

describe('TaskActions', () => {
  function setup(accept: boolean) {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const tasks = TestBed.inject(TaskService);
    http.expectOne(TODOS).flush(SEED);
    const ask = spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(accept);
    const toast = TestBed.inject(ToastService);
    return { http, tasks, ask, toast, actions: TestBed.inject(TaskActions) };
  }

  const ids = (tasks: TaskService) => tasks.tasks().map((t) => t.id);

  describe('toggleCompleted', () => {
    it('asks for confirmation naming the new status', async () => {
      const { actions, ask } = setup(false);
      await actions.toggleCompleted(SEED[0]);
      expect(ask).toHaveBeenCalledWith(jasmine.objectContaining({ message: jasmine.stringContaining('completada') }));
    });

    it('does nothing when the user cancels', async () => {
      const { actions, http, tasks, toast } = setup(false);
      await actions.toggleCompleted(SEED[0]);
      http.expectNone({ method: 'PUT' });
      expect(tasks.tasks()[0].completed).toBeFalse();
      expect(toast.toasts()).toEqual([]);
    });

    it('updates the task and shows a toast when the user accepts', async () => {
      const { actions, http, tasks, toast } = setup(true);
      await actions.toggleCompleted(SEED[0]);
      http.expectOne({ method: 'PUT', url: `${TODOS}/1` }).flush({});
      expect(tasks.tasks()[0].completed).toBeTrue();
      expect(toast.toasts()[0].message).toContain('#1 marcada como completada');
      toast.dismiss(toast.toasts()[0].id);
    });

    it('goes from completed back to pending', async () => {
      const { actions, http, tasks, toast } = setup(true);
      await actions.toggleCompleted(SEED[1]);
      http.expectOne({ method: 'PUT', url: `${TODOS}/2` }).flush({});
      expect(tasks.tasks()[1].completed).toBeFalse();
      toast.dismiss(toast.toasts()[0].id);
    });
  });

  describe('remove', () => {
    it('asks with a destructive (danger) confirmation', async () => {
      const { actions, ask } = setup(false);
      await actions.remove(SEED[0]);
      expect(ask).toHaveBeenCalledWith(jasmine.objectContaining({ danger: true }));
    });

    it('does nothing when the user cancels', async () => {
      const { actions, http, tasks } = setup(false);
      await actions.remove(SEED[0]);
      http.expectNone({ method: 'DELETE' });
      expect(ids(tasks)).toEqual([1, 2, 3]);
    });

    it('deletes the task and offers to undo it', async () => {
      const { actions, http, tasks, toast } = setup(true);
      await actions.remove(SEED[1]);
      http.expectOne({ method: 'DELETE', url: `${TODOS}/2` }).flush({});
      expect(ids(tasks)).toEqual([1, 3]);
      expect(toast.toasts()[0].actionLabel).toBe('Deshacer');

      toast.runAction(toast.toasts()[0]); // Deshacer
      expect(ids(tasks)).toEqual([1, 2, 3]); // en su posición original
      expect(toast.toasts()[0].message).toContain('restaurada');
      toast.dismiss(toast.toasts()[0].id);
    });

    it('explains why it cannot undo when the id was reused by a new task', async () => {
      const { actions, http, tasks, toast } = setup(true);
      await actions.remove(SEED[2]); // la de id más alto
      http.expectOne({ method: 'DELETE', url: `${TODOS}/3` }).flush({});
      const undo = toast.toasts()[0];

      tasks.addTask({ title: 'nueva', userId: 1, completed: false }).subscribe();
      http.expectOne({ method: 'POST', url: TODOS }).flush({});
      expect(ids(tasks)).toContain(3); // la nueva ha reutilizado el id 3

      toast.runAction(undo);
      expect(toast.toasts().at(-1)?.message).toContain('No se pudo restaurar');
      expect(ids(tasks).filter((id) => id === 3).length).toBe(1); // sin duplicados
      toast.toasts().forEach((t) => toast.dismiss(t.id));
    });
  });
});
