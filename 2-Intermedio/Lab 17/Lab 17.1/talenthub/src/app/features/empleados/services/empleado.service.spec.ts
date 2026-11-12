import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NOTIFICAR_404 } from '@core/interceptors/http-context';
import { Empleado, NuevoEmpleado } from '../models/empleado.model';
import { EmpleadoService } from './empleado.service';

const API = 'http://localhost:8000/users';
const usuario = (id: number, name = `Usuario ${id}`) => ({
  id,
  name,
  email: `u${id}@example.com`,
  phone: '',
  website: '',
  company: { name: 'X' },
});

describe('EmpleadoService', () => {
  let servicio: EmpleadoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(EmpleadoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  describe('getAll', () => {
    it('pide /users al backend local y mapea a Empleado', () => {
      let resultado: Empleado[] = [];
      servicio.getAll().subscribe((e) => (resultado = e));
      http.expectOne({ method: 'GET', url: API }).flush([usuario(1, 'Ana'), usuario(2, 'Luis')]);
      expect(resultado.map((e) => e.nombre)).toEqual(['Ana', 'Luis']);
      expect(resultado[0].email).toBe('u1@example.com');
    });

    it('descarta los elementos con forma inválida y tolera lo que no es una lista', () => {
      let resultado: Empleado[] = [];
      servicio.getAll().subscribe((e) => (resultado = e));
      http.expectOne(API).flush([usuario(1), { id: 'x' }, null, 7]);
      expect(resultado.length).toBe(1);

      servicio.getAll().subscribe((e) => (resultado = e));
      http.expectOne(API).flush({ detalle: 'no soy una lista' });
      expect(resultado).toEqual([]);
    });

    describe('búsqueda por término', () => {
      it('sin término pide /users sin parámetros', () => {
        servicio.getAll().subscribe();
        const req = http.expectOne((r) => r.url === API);
        expect(req.request.params.keys()).toEqual([]);
        req.flush([]);
      });

      it('con término lo envía como q, recortado', () => {
        servicio.getAll('  ervin ').subscribe();
        const req = http.expectOne((r) => r.url === API);
        expect(req.request.params.get('q')).toBe('ervin');
        req.flush([]);
      });

      it('un término vacío o solo de espacios equivale a no buscar', () => {
        servicio.getAll('   ').subscribe();
        const req = http.expectOne((r) => r.url === API);
        expect(req.request.params.has('q')).toBeFalse();
        req.flush([]);
      });

      it('la búsqueda también se reintenta ante un error del servidor', fakeAsync(() => {
        let resultado: Empleado[] | undefined;
        servicio.getAll('ana').subscribe((e) => (resultado = e));
        http.expectOne((r) => r.url === API).flush('', { status: 500, statusText: 'x' });
        tick(1000);
        http.expectOne((r) => r.url === API && r.params.get('q') === 'ana').flush([usuario(1)]);
        expect(resultado?.length).toBe(1);
      }));
    });

    describe('reintentos', () => {
      it('si el servidor falla (500) reintenta 2 veces, con 1 s y 2 s de espera, y acaba entregando los datos', fakeAsync(() => {
        let resultado: Empleado[] | undefined;
        servicio.getAll().subscribe((e) => (resultado = e));

        http.expectOne(API).flush('', { status: 500, statusText: 'x' });
        tick(999);
        http.expectNone(API); // aún no ha pasado 1 s
        tick(1);
        http.expectOne(API).flush('', { status: 503, statusText: 'x' });
        tick(1999);
        http.expectNone(API); // aún no han pasado 2 s
        tick(1);
        http.expectOne(API).flush([usuario(1)]);

        expect(resultado?.length).toBe(1);
      }));

      it('tras 3 intentos fallidos propaga el error', fakeAsync(() => {
        let error: { status: number } | undefined;
        servicio.getAll().subscribe({ error: (e) => (error = e) });

        http.expectOne(API).flush('', { status: 500, statusText: 'x' });
        tick(1000);
        http.expectOne(API).flush('', { status: 500, statusText: 'x' });
        tick(2000);
        http.expectOne(API).flush('', { status: 500, statusText: 'x' });

        expect(error?.status).toBe(500);
      }));

      it('si no hay conexión (estado 0) también reintenta', fakeAsync(() => {
        servicio.getAll().subscribe({ error: () => undefined });
        http.expectOne(API).error(new ProgressEvent('error'));
        tick(1000);
        http.expectOne(API).error(new ProgressEvent('error'));
        tick(2000);
        http.expectOne(API).error(new ProgressEvent('error'));
      }));

      it('un error del cliente (404) no se reintenta', fakeAsync(() => {
        let error: { status: number } | undefined;
        servicio.getAll().subscribe({ error: (e) => (error = e) });
        http.expectOne(API).flush('', { status: 404, statusText: 'x' });
        tick(5000);
        http.expectNone(API);
        expect(error?.status).toBe(404);
      }));
    });
  });

  describe('getById', () => {
    it('devuelve el empleado', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(3).subscribe((e) => (resultado = e));
      http.expectOne({ method: 'GET', url: `${API}/3` }).flush(usuario(3, 'Marta'));
      expect(resultado?.nombre).toBe('Marta');
    });

    it('devuelve null cuando no existe (404), sin romper', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(999).subscribe((e) => (resultado = e));
      http.expectOne(`${API}/999`).flush('', { status: 404, statusText: 'Not Found' });
      expect(resultado).toBeNull();
    });

    it('marca la petición para que el interceptor no avise del 404 (es una respuesta esperada)', () => {
      servicio.getById(999).subscribe();
      const req = http.expectOne(`${API}/999`);
      expect(req.request.context.get(NOTIFICAR_404)).toBeFalse();
      req.flush('', { status: 404, statusText: 'x' });
    });

    it('devuelve null si la respuesta no tiene la forma de un usuario', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(3).subscribe((e) => (resultado = e));
      http.expectOne(`${API}/3`).flush({ otra: 'cosa' });
      expect(resultado).toBeNull();
    });

    it('propaga los errores que no son 404 y no reintenta', () => {
      let error: { status: number } | undefined;
      servicio.getById(3).subscribe({ error: (e) => (error = e) });
      http.expectOne(`${API}/3`).flush('', { status: 500, statusText: 'x' });
      expect(error?.status).toBe(500);
    });

    it('no pide nada si el id no es un entero', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(Number('abc')).subscribe((e) => (resultado = e));
      http.expectNone(API);
      expect(resultado).toBeNull();
    });
  });

  describe('crear', () => {
    const datos: NuevoEmpleado = {
      nombre: 'Marta Ruiz',
      email: 'marta@example.com',
      rol: 'qa',
      habilidades: [{ nombre: 'Cypress', nivel: 'senior' }],
      disponible: false,
      proyectoActualId: 7,
    };

    it('envía a la API solo name y email', () => {
      servicio.crear(datos).subscribe();
      const req = http.expectOne({ method: 'POST', url: API });
      expect(req.request.body).toEqual({ name: 'Marta Ruiz', email: 'marta@example.com' });
      req.flush(usuario(11, 'Marta Ruiz'));
    });

    it('devuelve el empleado con el id de la API y conserva los datos que la API no guarda', () => {
      let creado: Empleado | undefined;
      servicio.crear(datos).subscribe((e) => (creado = e));
      http.expectOne(API).flush({ ...usuario(11, 'Marta Ruiz'), email: 'marta@example.com' });
      expect(creado?.id).toBe(11);
      expect(creado?.nombre).toBe('Marta Ruiz');
      expect(creado?.rol).toBe('qa');
      expect(creado?.habilidades).toEqual(datos.habilidades);
      expect(creado?.disponible).toBeFalse();
      expect(creado?.proyectoActualId).toBe(7);
    });

    it('falla si la API responde algo que no es un empleado', () => {
      let error: unknown;
      servicio.crear(datos).subscribe({ error: (e) => (error = e) });
      http.expectOne(API).flush({ raro: true });
      expect(error).toBeInstanceOf(Error);
    });

    it('no reintenta una escritura que falla', fakeAsync(() => {
      servicio.crear(datos).subscribe({ error: () => undefined });
      http.expectOne(API).flush('', { status: 500, statusText: 'x' });
      tick(5000);
      http.expectNone(API);
    }));
  });

  describe('eliminar', () => {
    it('envía DELETE a /users/:id', () => {
      let terminado = false;
      servicio.eliminar(4).subscribe({ complete: () => (terminado = true) });
      http.expectOne({ method: 'DELETE', url: `${API}/4` }).flush(null, { status: 204, statusText: 'No Content' });
      expect(terminado).toBeTrue();
    });
  });

  it('usa el HttpClient del módulo (no uno propio)', () => {
    expect(TestBed.inject(HttpClient)).toBeTruthy();
  });
});
