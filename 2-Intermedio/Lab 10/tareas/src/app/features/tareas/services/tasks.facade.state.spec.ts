import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '@core/services/toast.service';
import { Task } from '../models/task.model';
import { TasksFacade } from './tasks.facade';

const TODOS = 'https://jsonplaceholder.typicode.com/todos';
const SEED: Task[] = [
  { id: 1, userId: 1, title: 'uno', completed: false, priority: 'medium' },
  { id: 2, userId: 1, title: 'dos', completed: true, priority: 'high' },
];

/** Estado expuesto y operaciones de datos de la fachada (las acciones con confirmación están en `tasks.facade.spec.ts`). */
describe('TasksFacade: estado y datos', () => {
  let http: HttpTestingController;
  let facade: TasksFacade;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(TasksFacade);
    toast = TestBed.inject(ToastService);
    http.expectOne(TODOS).flush(SEED);
  });
  afterEach(() => toast.toasts().forEach((t) => toast.dismiss(t.id)));

  it('expone el estado: tareas, carga y derivados (pending, completed, total)', () => {
    expect(facade.status()).toBe('ready');
    expect(facade.tasks().length).toBe(2);
    expect(facade.pending().map((t) => t.id)).toEqual([1]);
    expect(facade.completed().map((t) => t.id)).toEqual([2]);
    expect(facade.total()).toBe(2);
    expect((facade.tasks as unknown as { set?: unknown }).set).toBeUndefined();
  });

  it('reload() vuelve a pedir la lista y sustituye lo que hubiera', () => {
    facade.reload();
    expect(facade.status()).toBe('loading');
    http.expectOne(TODOS).flush([SEED[0]]);
    expect(facade.tasks().map((t) => t.id)).toEqual([1]);
  });

  it('getById devuelve la tarea de la memoria o null', () => {
    let resultado: Task | null | undefined;
    facade.getById(2).subscribe((t) => (resultado = t));
    expect(resultado?.title).toBe('dos');
    facade.getById(99).subscribe((t) => (resultado = t));
    expect(resultado).toBeNull();
  });

  it('search pide a la API las tareas que coinciden con el término', () => {
    let ids: number[] = [];
    facade.search(' un ').subscribe((tareas) => (ids = tareas.map((t) => t.id)));
    const peticion = http.expectOne((r) => r.url === TODOS && r.params.get('q') === 'un');
    peticion.flush([SEED[0]]);
    expect(ids).toEqual([1]);
  });

  describe('create', () => {
    it('crea la tarea, la deja arriba SIN recargar la lista y avisa', async () => {
      const promesa = facade.create({ title: 'nueva', userId: 1, completed: false, priority: 'low' });
      const post = http.expectOne({ method: 'POST', url: TODOS });
      expect(post.request.body).toEqual(jasmine.objectContaining({ title: 'nueva', priority: 'low' }));
      post.flush({ id: 201 });
      const creada = await promesa;

      expect(facade.tasks()[0].title).toBe('nueva');
      expect(facade.total()).toBe(3);
      expect(facade.pending().length).toBe(2);
      expect(creada.title).toBe('nueva');
      expect(toast.toasts().map((t) => t.message)).toEqual([`Tarea #${creada.id} creada`]);
      http.expectNone({ method: 'GET', url: TODOS }); // no se ha vuelto a pedir la lista
    });
  });

  describe('update', () => {
    it('guarda el cambio, actualiza la lista SIN recargar y avisa', async () => {
      const promesa = facade.update({ ...SEED[0], title: 'uno editado', completed: true });
      http.expectOne({ method: 'PUT', url: `${TODOS}/1` }).flush({});
      await promesa;

      expect(facade.tasks()[0].title).toBe('uno editado');
      expect(facade.completed().length).toBe(2);
      expect(toast.toasts().map((t) => t.message)).toEqual(['Tarea #1 actualizada']);
      http.expectNone({ method: 'GET', url: TODOS });
    });
  });
});
