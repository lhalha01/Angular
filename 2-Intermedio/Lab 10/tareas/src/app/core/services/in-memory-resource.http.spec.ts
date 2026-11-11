import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ERRORES_ESPERADOS, NOTIFICAR_ERRORES, OPERACION } from '../interceptors/http-context';
import { InMemoryResource } from './in-memory-resource';

/** Capa HTTP de `InMemoryResource` (Lab 14.2): reintentos de la carga, contexto de cada petición y traducción DTO ↔ dominio. */

interface Item {
  id: number;
  nombre: string;
}
/** Formato de la API de este recurso de prueba: distinto del dominio, para comprobar la traducción. */
interface ItemDto {
  id: number;
  name: string;
}

const URL = 'https://api.test/items';

class DemoResource extends InMemoryResource<Item> {
  protected readonly apiUrl = URL;
  protected override readonly etiqueta = 'los elementos';
  constructor() {
    super();
    this.reload();
  }
  protected override fromApi(json: unknown): Item | null {
    const dto = json as Partial<ItemDto> | null;
    return typeof dto?.id === 'number' && typeof dto.name === 'string' ? { id: dto.id, nombre: dto.name } : null;
  }
  protected override toApi(item: Item, conId: boolean): unknown {
    return { ...(conId && { id: item.id }), name: item.nombre };
  }
  add(item: Item) {
    return this.addItem(item, 'end', 'No se pudo crear el elemento');
  }
  update(item: Item) {
    return this.updateItem(item, 'No se pudo guardar el elemento');
  }
  remove(id: number) {
    return this.deleteItem(id, 'No se pudo borrar el elemento');
  }
  restore(item: Item) {
    return this.restoreItem(item, 0, 'No se pudo restaurar el elemento');
  }
}

describe('InMemoryResource (capa HTTP)', () => {
  const original = { ...environment };
  let http: HttpTestingController;
  let recurso: DemoResource;

  function crear(persistente: boolean) {
    environment.persistentApi = persistente;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    recurso = TestBed.runInInjectionContext(() => new DemoResource());
  }
  const cargar = (datos: ItemDto[] = [{ id: 1, name: 'uno' }]) => http.expectOne(URL).flush(datos);

  afterEach(() => {
    Object.assign(environment, original); // no contaminar al resto de tests
    http.verify();
  });

  describe('traducción DTO ↔ dominio', () => {
    it('la carga traduce el DTO al dominio y descarta lo que no encaja', () => {
      crear(true);
      cargar([{ id: 1, name: 'uno' }, { id: 'x' } as never, null as never]);
      expect(recurso.items()).toEqual([{ id: 1, nombre: 'uno' }]);
    });

    it('si la respuesta no es una lista, el estado es error', () => {
      crear(true);
      http.expectOne(URL).flush({ detalle: 'no soy una lista' });
      expect(recurso.status()).toBe('error');
    });

    it('al crear con el backend propio envía el DTO sin id y devuelve lo que responde el servidor, ya en dominio', () => {
      crear(true);
      cargar();
      let creado: Item | undefined;
      recurso.add({ id: 99, nombre: 'nuevo' }).subscribe((i) => (creado = i));
      const post = http.expectOne({ method: 'POST', url: URL });
      expect(post.request.body).toEqual({ name: 'nuevo' });
      post.flush({ id: 7, name: 'nuevo' });
      expect(creado).toEqual({ id: 7, nombre: 'nuevo' });
    });

    it('al sustituir envía el DTO con id', () => {
      crear(true);
      cargar();
      recurso.update({ id: 1, nombre: 'cambiado' }).subscribe();
      const put = http.expectOne({ method: 'PUT', url: `${URL}/1` });
      expect(put.request.body).toEqual({ id: 1, name: 'cambiado' });
      put.flush({ id: 1, name: 'cambiado' });
      expect(recurso.items()).toEqual([{ id: 1, nombre: 'cambiado' }]);
    });

    it('si el servidor responde algo que no es un elemento, la escritura falla', () => {
      crear(true);
      cargar();
      let error: unknown;
      recurso.add({ id: 2, nombre: 'x' }).subscribe({ error: (e) => (error = e) });
      http.expectOne({ method: 'POST', url: URL }).flush({ raro: true });
      expect(error).toBeInstanceOf(Error);
    });

    it('getById traduce el DTO y devuelve null si no encaja', () => {
      crear(true);
      let uno: Item | null | undefined;
      recurso.getById(1).subscribe((i) => (uno = i));
      http.expectOne(`${URL}/1`).flush({ id: 1, name: 'uno' });
      expect(uno).toEqual({ id: 1, nombre: 'uno' });

      let raro: Item | null | undefined;
      recurso.getById(2).subscribe((i) => (raro = i));
      http.expectOne(`${URL}/2`).flush({ otra: 'cosa' });
      expect(raro).toBeNull();
      http.expectOne(URL).flush([]); // la carga inicial del recurso, pendiente
    });
  });

  describe('reintentos de la carga', () => {
    it('ante un 500 reintenta 2 veces (1 s y 2 s) y, si por fin responde, carga los datos', fakeAsync(() => {
      crear(true);
      http.expectOne(URL).flush('', { status: 500, statusText: 'x' });
      expect(recurso.status()).toBe('loading');
      tick(999);
      http.expectNone(URL);
      tick(1);
      http.expectOne(URL).flush('', { status: 503, statusText: 'x' });
      tick(2000);
      cargar();
      expect(recurso.status()).toBe('ready');
      expect(recurso.items().length).toBe(1);
    }));

    it('un error del cliente (404) no se reintenta: el estado pasa a error enseguida', fakeAsync(() => {
      crear(true);
      http.expectOne(URL).flush('', { status: 404, statusText: 'x' });
      expect(recurso.status()).toBe('error');
      tick(5000);
      http.expectNone(URL);
    }));

    it('las escrituras no se reintentan', fakeAsync(() => {
      crear(true);
      cargar();
      recurso.remove(1).subscribe({ error: () => undefined });
      http.expectOne({ method: 'DELETE', url: `${URL}/1` }).flush('', { status: 500, statusText: 'x' });
      tick(5000);
      http.expectNone(`${URL}/1`);
    }));
  });

  describe('contexto de cada petición (lo que lee el interceptor de errores)', () => {
    it('la carga lleva el texto de la operación y avisa de los errores', () => {
      crear(true);
      const req = http.expectOne(URL);
      expect(req.request.context.get(OPERACION)).toBe('No se pudieron cargar los elementos');
      expect(req.request.context.get(NOTIFICAR_ERRORES)).toBeTrue();
      expect(req.request.context.get(ERRORES_ESPERADOS)).toEqual([]);
      req.flush([]);
    });

    it('getById declara el 404 como esperado', () => {
      crear(true);
      recurso.getById(5).subscribe();
      const req = http.expectOne(`${URL}/5`);
      expect(req.request.context.get(ERRORES_ESPERADOS)).toEqual([404]);
      req.flush('', { status: 404, statusText: 'x' });
      http.expectOne(URL).flush([]);
    });

    it('cada escritura lleva su texto; restaurar declara el 409 como esperado', () => {
      crear(true);
      cargar();
      recurso.add({ id: 2, nombre: 'a' }).subscribe();
      const post = http.expectOne({ method: 'POST', url: URL });
      expect(post.request.context.get(OPERACION)).toBe('No se pudo crear el elemento');
      post.flush({ id: 2, name: 'a' });

      recurso.update({ id: 2, nombre: 'b' }).subscribe();
      const put = http.expectOne({ method: 'PUT', url: `${URL}/2` });
      expect(put.request.context.get(OPERACION)).toBe('No se pudo guardar el elemento');
      put.flush({ id: 2, name: 'b' });

      recurso.remove(2).subscribe();
      const del = http.expectOne({ method: 'DELETE', url: `${URL}/2` });
      expect(del.request.context.get(OPERACION)).toBe('No se pudo borrar el elemento');
      del.flush(null);

      recurso.restore({ id: 2, nombre: 'b' }).subscribe();
      const restaurar = http.expectOne({ method: 'POST', url: URL });
      expect(restaurar.request.context.get(OPERACION)).toBe('No se pudo restaurar el elemento');
      expect(restaurar.request.context.get(ERRORES_ESPERADOS)).toEqual([409]);
      expect(restaurar.request.body).toEqual({ id: 2, name: 'b' });
      restaurar.flush({ id: 2, name: 'b' });
    });

    it('con la API de mentira las escrituras piden silencio (NOTIFICAR_ERRORES = false)', () => {
      crear(false);
      cargar();
      recurso.add({ id: 2, nombre: 'a' }).subscribe();
      const post = http.expectOne({ method: 'POST', url: URL });
      expect(post.request.context.get(NOTIFICAR_ERRORES)).toBeFalse();
      post.flush({}, { status: 500, statusText: 'x' }); // se ignora el resultado: el elemento se añade igualmente
      expect(recurso.items().map((i) => i.nombre)).toEqual(['uno', 'a']);
    });
  });
});
