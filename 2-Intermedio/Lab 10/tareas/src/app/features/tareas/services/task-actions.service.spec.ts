import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Task } from '../models/task.model';
import { ConfirmService } from '@core/services/confirm.service';
import { TaskService } from './task.service';
import { ToastService } from '@core/services/toast.service';
import { TaskActions } from './task-actions.service';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const SEED: Task[] = [
  { id: 1, userId: 1, title: 'uno', completed: false, priority: 'medium' },
  { id: 2, userId: 1, title: 'dos', completed: true, priority: 'medium' },
  { id: 3, userId: 2, title: 'tres', completed: false, priority: 'medium' },
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

      tasks.addTask({ title: 'nueva', userId: 1, completed: false, priority: 'medium' }).subscribe();
      http.expectOne({ method: 'POST', url: TODOS }).flush({});
      expect(ids(tasks)).toContain(3); // la nueva ha reutilizado el id 3

      toast.runAction(undo);
      expect(toast.toasts().at(-1)?.message).toContain('No se pudo restaurar');
      expect(ids(tasks).filter((id) => id === 3).length).toBe(1); // sin duplicados
      toast.toasts().forEach((t) => toast.dismiss(t.id));
    });
  });
});

/** Con el backend propio los errores de la API llegan al usuario y "Deshacer" recrea la tarea allí. */
describe('TaskActions with the own backend (persistentApi)', () => {
  const LOCAL = 'http://localhost:8000/todos';
  const original = { ...environment };
  const STORED: Task[] = SEED.map((t, i) => ({ ...t, createdAt: `2026-01-01T00:00:0${i + 1}.000Z` }));
  const fail = (status: number, body: unknown = {}) => ({ status, statusText: 'error', body });

  function setup(accept = true) {
    environment.apiUrl = 'http://localhost:8000';
    environment.persistentApi = true;
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const tasks = TestBed.inject(TaskService);
    http.expectOne(LOCAL).flush(STORED);
    spyOn(TestBed.inject(ConfirmService), 'ask').and.resolveTo(accept);
    return { http, tasks, toast: TestBed.inject(ToastService), actions: TestBed.inject(TaskActions) };
  }
  const messages = (toast: ToastService) => toast.toasts().map((t) => t.message);
  const cleanUp = (toast: ToastService) => toast.toasts().forEach((t) => toast.dismiss(t.id));

  afterEach(() => Object.assign(environment, original)); // no contaminar al resto de tests

  describe('toggleCompleted', () => {
    it('updates the task and avisa when the API accepts it', async () => {
      const { actions, http, tasks, toast } = setup();
      await actions.toggleCompleted(STORED[0]);
      http.expectOne({ method: 'PUT', url: `${LOCAL}/1` }).flush({ ...STORED[0], completed: true });
      expect(tasks.tasks()[0].completed).toBeTrue();
      expect(messages(toast)[0]).toContain('marcada como completada');
      cleanUp(toast);
    });

    it('shows the server reason and keeps the task unchanged when the API rejects it', async () => {
      const { actions, http, tasks, toast } = setup();
      await actions.toggleCompleted(STORED[0]);
      http.expectOne({ method: 'PUT', url: `${LOCAL}/1` }).flush({ detail: 'El usuario 1 no existe' }, fail(422));
      expect(tasks.tasks()[0].completed).toBeFalse();
      expect(messages(toast)).toEqual(['No se pudo cambiar el estado de la tarea: El usuario 1 no existe.']);
      cleanUp(toast);
    });

    it('says the backend is not reachable when there is no connection', async () => {
      const { actions, http, toast } = setup();
      await actions.toggleCompleted(STORED[0]);
      http.expectOne({ method: 'PUT', url: `${LOCAL}/1` }).error(new ProgressEvent('error'));
      expect(messages(toast)[0]).toContain('¿Está arrancado el backend?');
      cleanUp(toast);
    });
  });

  describe('remove', () => {
    it('deletes in the API and offers to undo it', async () => {
      const { actions, http, tasks, toast } = setup();
      await actions.remove(STORED[1]);
      http.expectOne({ method: 'DELETE', url: `${LOCAL}/2` }).flush(null, { status: 204, statusText: 'No Content' });
      expect(tasks.tasks().map((t) => t.id)).toEqual([1, 3]);
      expect(toast.toasts()[0].actionLabel).toBe('Deshacer');
      cleanUp(toast);
    });

    it('keeps the task and offers no undo when the API fails', async () => {
      const { actions, http, tasks, toast } = setup();
      await actions.remove(STORED[1]);
      http.expectOne({ method: 'DELETE', url: `${LOCAL}/2` }).flush({ detail: 'Tarea 2 no encontrada' }, fail(404));
      expect(tasks.tasks().map((t) => t.id)).toEqual([1, 2, 3]);
      expect(toast.toasts().length).toBe(1);
      expect(toast.toasts()[0].actionLabel).toBeUndefined();
      expect(messages(toast)[0]).toBe('No se pudo eliminar la tarea: Tarea 2 no encontrada.');
      cleanUp(toast);
    });

    describe('undo', () => {
      async function removeAndGetUndo() {
        const ctx = setup();
        await ctx.actions.remove(STORED[1]);
        ctx.http.expectOne({ method: 'DELETE', url: `${LOCAL}/2` }).flush(null, { status: 204, statusText: 'No Content' });
        return { ...ctx, undo: ctx.toast.toasts()[0] };
      }

      it('recreates the task in the API with its same id and date, in its original position', async () => {
        const { http, tasks, toast, undo } = await removeAndGetUndo();
        toast.runAction(undo);
        const req = http.expectOne({ method: 'POST', url: LOCAL });
        expect(req.request.body).toEqual(STORED[1]);
        req.flush(STORED[1], { status: 201, statusText: 'Created' });

        expect(tasks.tasks().map((t) => t.id)).toEqual([1, 2, 3]);
        expect(messages(toast).at(-1)).toContain('restaurada');
        cleanUp(toast);
      });

      it('explains that the id is already in use when the server answers 409', async () => {
        const { http, tasks, toast, undo } = await removeAndGetUndo();
        toast.runAction(undo);
        http.expectOne({ method: 'POST', url: LOCAL }).flush({ detail: 'El id 2 ya está en uso' }, fail(409));
        expect(messages(toast).at(-1)).toBe('No se pudo restaurar: el id ya está en uso');
        expect(tasks.tasks().map((t) => t.id)).toEqual([1, 3]);
        cleanUp(toast);
      });

      it('shows the reason for any other failure', async () => {
        const { http, toast, undo } = await removeAndGetUndo();
        toast.runAction(undo);
        http.expectOne({ method: 'POST', url: LOCAL }).flush({ detail: 'El usuario 1 no existe' }, fail(422));
        expect(messages(toast).at(-1)).toBe('No se pudo restaurar la tarea: El usuario 1 no existe.');
        cleanUp(toast);
      });
    });
  });
});
