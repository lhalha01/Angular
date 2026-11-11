import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { InMemoryResource } from './in-memory-resource';

interface Item {
  id: number;
  name: string;
}

const URL = 'https://api.test/items';
const SEED: Item[] = [
  { id: 1, name: 'uno' },
  { id: 2, name: 'dos' },
  { id: 3, name: 'tres' },
];

/** Servicio mínimo que expone las operaciones protegidas de la base. */
class FakeResource extends InMemoryResource<Item> {
  protected readonly apiUrl = URL;
  protected override isItem(value: unknown): value is Item {
    const v = value as Partial<Item> | null;
    return typeof v?.id === 'number' && typeof v.name === 'string';
  }
  constructor() {
    super();
    this.reload();
  }
  add(item: Item, at: 'start' | 'end' = 'end') {
    return this.addItem(item, at);
  }
  update(item: Item) {
    return this.updateItem(item);
  }
  remove(id: number) {
    return this.deleteItem(id);
  }
  restore(item: Item, index: number) {
    return this.restoreItem(item, index);
  }
  next() {
    return this.nextId();
  }
  protected override prepare(items: Item[]): Item[] {
    return items.map((item) => ({ ...item, name: item.name.toUpperCase() }));
  }
}

describe('InMemoryResource', () => {
  let http: HttpTestingController;
  let resource: FakeResource;
  const names = () => resource.items().map((i) => i.name);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    resource = TestBed.runInInjectionContext(() => new FakeResource());
  });

  afterEach(() => http.verify());

  const load = () => http.expectOne({ method: 'GET', url: URL }).flush(SEED);

  describe('loading', () => {
    it('starts as loading and becomes ready with the data', () => {
      expect(resource.status()).toBe('loading');
      load();
      expect(resource.status()).toBe('ready');
      expect(resource.items().length).toBe(3);
    });

    it('passes the data through the prepare hook', () => {
      load();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });

    it('discards the elements whose shape is not valid', () => {
      http.expectOne({ method: 'GET', url: URL }).flush([...SEED, { id: 'x', name: 1 }, null, 7]);
      expect(resource.status()).toBe('ready');
      expect(resource.items().length).toBe(3);
    });

    it('reports an error when the response is not a list', () => {
      http.expectOne({ method: 'GET', url: URL }).flush({ message: 'no soy una lista' });
      expect(resource.status()).toBe('error');
    });

    it('reports an error and can be reloaded', () => {
      http.expectOne(URL).error(new ProgressEvent('error'));
      expect(resource.status()).toBe('error');

      resource.reload();
      expect(resource.status()).toBe('loading');
      load();
      expect(resource.status()).toBe('ready');
    });
  });

  describe('getById', () => {
    it('reads from memory once the data is loaded', () => {
      load();
      let result: Item | null | undefined;
      resource.getById(2).subscribe((item) => (result = item));
      expect(result?.name).toBe('DOS');
      resource.getById(99).subscribe((item) => (result = item));
      expect(result).toBeNull();
    });

    it('asks the API while the data is still loading', () => {
      let result: Item | null | undefined;
      resource.getById(7).subscribe((item) => (result = item));
      http.expectOne({ method: 'GET', url: `${URL}/7` }).flush({ id: 7, name: 'siete' });
      expect(result).toEqual({ id: 7, name: 'siete' });
      load();
    });

    it('returns null if the API fails', () => {
      let result: Item | null | undefined;
      resource.getById(7).subscribe((item) => (result = item));
      http.expectOne(`${URL}/7`).error(new ProgressEvent('error'));
      expect(result).toBeNull();
      load();
    });

    it('returns null for ids that are not integers, without any request', () => {
      let result: Item | null | undefined = undefined;
      resource.getById(NaN).subscribe((item) => (result = item));
      resource.getById(1.5).subscribe((item) => (result = item));
      expect(result).toBeNull();
      load(); // única petición pendiente: la carga inicial
    });

    it('does not bring back a deleted item from the API', () => {
      load();
      resource.remove(1).subscribe();
      http.expectOne({ method: 'DELETE', url: `${URL}/1` }).flush({});
      let result: Item | null | undefined;
      resource.getById(1).subscribe((item) => (result = item));
      expect(result).toBeNull();
    });
  });

  describe('writes', () => {
    beforeEach(load);

    it('adds at the end or at the start, and sends the POST', () => {
      resource.add({ id: 4, name: 'cuatro' }).subscribe();
      http.expectOne({ method: 'POST', url: URL }).flush({ id: 201 });
      resource.add({ id: 5, name: 'cinco' }, 'start').subscribe();
      http.expectOne({ method: 'POST', url: URL }).flush({ id: 201 });
      expect(names()).toEqual(['cinco', 'UNO', 'DOS', 'TRES', 'cuatro']);
    });

    it('keeps its own id and ignores the one in the server response', () => {
      let created: Item | undefined;
      resource.add({ id: 4, name: 'cuatro' }).subscribe((item) => (created = item));
      http.expectOne(URL).flush({ id: 201, name: 'otro' });
      expect(created).toEqual({ id: 4, name: 'cuatro' });
    });

    it('updates an item', () => {
      resource.update({ id: 2, name: 'DOS!' }).subscribe();
      http.expectOne({ method: 'PUT', url: `${URL}/2` }).flush({});
      expect(names()).toEqual(['UNO', 'DOS!', 'TRES']);
    });

    it('deletes an item', () => {
      resource.remove(2).subscribe();
      http.expectOne({ method: 'DELETE', url: `${URL}/2` }).flush({});
      expect(names()).toEqual(['UNO', 'TRES']);
    });

    it('applies every write in memory even if the API fails', () => {
      resource.add({ id: 4, name: 'cuatro' }).subscribe();
      http.expectOne({ method: 'POST', url: URL }).error(new ProgressEvent('error'));
      resource.update({ id: 1, name: 'UNO!' }).subscribe();
      http.expectOne({ method: 'PUT', url: `${URL}/1` }).error(new ProgressEvent('error'));
      resource.remove(3).subscribe();
      http.expectOne({ method: 'DELETE', url: `${URL}/3` }).error(new ProgressEvent('error'));
      expect(names()).toEqual(['UNO!', 'DOS', 'cuatro']);
    });
  });

  describe('restore', () => {
    beforeEach(load);

    /** Con la API de mentira restaurar es inmediato (no hay petición): el resultado llega al suscribirse. */
    const restore = (item: Item, index: number): boolean | undefined => {
      let result: boolean | undefined;
      resource.restore(item, index).subscribe((restored) => (result = restored));
      return result;
    };

    it('puts a deleted item back in its original position', () => {
      const item = resource.items()[1];
      resource.remove(2).subscribe();
      http.expectOne(`${URL}/2`).flush({});
      expect(restore(item, 1)).toBeTrue();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });

    it('appends when the original position no longer exists', () => {
      expect(restore({ id: 9, name: 'nueve' }, 50)).toBeTrue();
      expect(resource.items().at(-1)?.id).toBe(9);
    });

    it('refuses to restore an id that is already in use', () => {
      expect(restore({ id: 1, name: 'duplicado' }, 0)).toBeFalse();
      expect(resource.items().length).toBe(3);
    });

    it('does not send any request to restore (the fake API forgets everything anyway)', () => {
      expect(restore({ id: 9, name: 'nueve' }, 0)).toBeTrue();
      http.expectNone({ method: 'POST' });
    });
  });

  describe('nextId', () => {
    it('is 1 for an empty collection and max + 1 otherwise', () => {
      expect(resource.next()).toBe(1);
      load();
      expect(resource.next()).toBe(4);
    });
  });
});

/** Con el backend propio (`persistentApi`): usa lo que responde el servidor y deja pasar sus errores. */
describe('InMemoryResource with the own backend (persistentApi)', () => {
  const original = { ...environment };
  let http: HttpTestingController;
  let resource: FakeResource;
  const names = () => resource.items().map((i) => i.name);
  const load = () => http.expectOne({ method: 'GET', url: URL }).flush(SEED);
  const serverError = (status: number) => ({ status, statusText: 'error' });

  beforeEach(() => {
    environment.persistentApi = true;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    resource = TestBed.runInInjectionContext(() => new FakeResource());
    load();
  });

  afterEach(() => {
    http.verify();
    Object.assign(environment, original); // no contaminar al resto de tests
  });

  describe('add', () => {
    it('sends the item without its client-side id and keeps what the server answers', () => {
      let created: Item | undefined;
      resource.add({ id: 4, name: 'cuatro' }).subscribe((item) => (created = item));
      const req = http.expectOne({ method: 'POST', url: URL });
      expect(req.request.body).toEqual({ name: 'cuatro' }); // sin id: lo asigna el servidor
      req.flush({ id: 77, name: 'cuatro' });

      expect(created).toEqual({ id: 77, name: 'CUATRO' }); // el id es el del servidor (y pasa por prepare)
      expect(resource.items().at(-1)?.id).toBe(77);
    });

    it('adds at the start when asked', () => {
      resource.add({ id: 4, name: 'cuatro' }, 'start').subscribe();
      http.expectOne({ method: 'POST', url: URL }).flush({ id: 77, name: 'cuatro' });
      expect(resource.items()[0].id).toBe(77);
    });

    it('propagates the API error and leaves the memory untouched', () => {
      let failed: unknown;
      resource.add({ id: 4, name: 'cuatro' }).subscribe({ error: (e) => (failed = e) });
      http.expectOne({ method: 'POST', url: URL }).flush({ detail: 'mal' }, serverError(422));
      expect(failed).toBeDefined();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });
  });

  describe('update', () => {
    it('sends a PUT and keeps what the server answers', () => {
      resource.update({ id: 2, name: 'nuevo' }).subscribe();
      http.expectOne({ method: 'PUT', url: `${URL}/2` }).flush({ id: 2, name: 'del servidor' });
      expect(names()).toEqual(['UNO', 'DEL SERVIDOR', 'TRES']);
    });

    it('propagates the API error and leaves the memory untouched', () => {
      let failed: unknown;
      resource.update({ id: 2, name: 'nuevo' }).subscribe({ error: (e) => (failed = e) });
      http.expectOne({ method: 'PUT', url: `${URL}/2` }).flush({}, serverError(500));
      expect(failed).toBeDefined();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });
  });

  describe('delete', () => {
    it('removes the item once the API confirms it', () => {
      let done = false;
      resource.remove(2).subscribe(() => (done = true));
      http.expectOne({ method: 'DELETE', url: `${URL}/2` }).flush(null, { status: 204, statusText: 'No Content' });
      expect(done).toBeTrue();
      expect(names()).toEqual(['UNO', 'TRES']);
    });

    it('propagates the API error and keeps the item', () => {
      let failed: unknown;
      resource.remove(2).subscribe({ error: (e) => (failed = e) });
      http.expectOne({ method: 'DELETE', url: `${URL}/2` }).flush({}, serverError(404));
      expect(failed).toBeDefined();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });

    it('propagates a network failure (the backend is not running)', () => {
      let failed: unknown;
      resource.remove(2).subscribe({ error: (e) => (failed = e) });
      http.expectOne({ method: 'DELETE', url: `${URL}/2` }).error(new ProgressEvent('error'));
      expect(failed).toBeDefined();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });
  });

  describe('restore ("Deshacer")', () => {
    const removeSecond = () => {
      const item = resource.items()[1];
      resource.remove(2).subscribe();
      http.expectOne({ method: 'DELETE', url: `${URL}/2` }).flush(null, { status: 204, statusText: 'No Content' });
      return item;
    };

    it('recreates the item in the API with its same id and puts it back in place', () => {
      const item = removeSecond();
      let restored: boolean | undefined;
      resource.restore(item, 1).subscribe((r) => (restored = r));

      const req = http.expectOne({ method: 'POST', url: URL });
      expect(req.request.body).toEqual(item); // con su id: el servidor lo recrea tal cual
      req.flush(item, { status: 201, statusText: 'Created' });

      expect(restored).toBeTrue();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });

    it('emits false when the server says the id is already in use (409)', () => {
      const item = removeSecond();
      let restored: boolean | undefined;
      resource.restore(item, 1).subscribe((r) => (restored = r));
      http.expectOne({ method: 'POST', url: URL }).flush({ detail: 'ocupado' }, serverError(409));
      expect(restored).toBeFalse();
      expect(names()).toEqual(['UNO', 'TRES']); // sin duplicados ni cambios
    });

    it('does not even ask the server when the id is already in memory', () => {
      let restored: boolean | undefined;
      resource.restore({ id: 1, name: 'duplicado' }, 0).subscribe((r) => (restored = r));
      http.expectNone({ method: 'POST' });
      expect(restored).toBeFalse();
    });

    it('propagates any other API error', () => {
      const item = removeSecond();
      let failed: unknown;
      resource.restore(item, 1).subscribe({ error: (e) => (failed = e) });
      http.expectOne({ method: 'POST', url: URL }).flush({}, serverError(500));
      expect(failed).toBeDefined();
      expect(names()).toEqual(['UNO', 'TRES']);
    });

    it('appends when the original position no longer exists', () => {
      resource.restore({ id: 9, name: 'nueve' }, 50).subscribe();
      http.expectOne({ method: 'POST', url: URL }).flush({ id: 9, name: 'nueve' }, { status: 201, statusText: 'Created' });
      expect(resource.items().at(-1)?.id).toBe(9);
    });
  });
});
