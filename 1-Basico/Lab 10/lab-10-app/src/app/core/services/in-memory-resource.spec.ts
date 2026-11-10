import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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

    it('puts a deleted item back in its original position', () => {
      const item = resource.items()[1];
      resource.remove(2).subscribe();
      http.expectOne(`${URL}/2`).flush({});
      expect(resource.restore(item, 1)).toBeTrue();
      expect(names()).toEqual(['UNO', 'DOS', 'TRES']);
    });

    it('appends when the original position no longer exists', () => {
      expect(resource.restore({ id: 9, name: 'nueve' }, 50)).toBeTrue();
      expect(resource.items().at(-1)?.id).toBe(9);
    });

    it('refuses to restore an id that is already in use', () => {
      expect(resource.restore({ id: 1, name: 'duplicado' }, 0)).toBeFalse();
      expect(resource.items().length).toBe(3);
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
