import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Empleado } from '../models/empleado.model';
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

    it('descarta los elementos con forma inválida', () => {
      let resultado: Empleado[] = [];
      servicio.getAll().subscribe((e) => (resultado = e));
      http.expectOne(API).flush([usuario(1), { id: 'x' }, null, 7]);
      expect(resultado.length).toBe(1);
    });

    it('si la respuesta no es una lista devuelve una lista vacía', () => {
      let resultado: Empleado[] | undefined;
      servicio.getAll().subscribe((e) => (resultado = e));
      http.expectOne(API).flush({ detalle: 'no soy una lista' });
      expect(resultado).toEqual([]);
    });
  });

  describe('getById', () => {
    it('devuelve el empleado', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(3).subscribe((e) => (resultado = e));
      http.expectOne({ method: 'GET', url: `${API}/3` }).flush(usuario(3, 'Marta'));
      expect(resultado?.nombre).toBe('Marta');
    });

    it('devuelve null cuando no existe (404)', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(999).subscribe((e) => (resultado = e));
      http.expectOne(`${API}/999`).flush('', { status: 404, statusText: 'Not Found' });
      expect(resultado).toBeNull();
    });

    it('devuelve null si la respuesta no tiene la forma de un usuario', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(3).subscribe((e) => (resultado = e));
      http.expectOne(`${API}/3`).flush({ otra: 'cosa' });
      expect(resultado).toBeNull();
    });

    it('propaga los errores que no son 404 (p. ej. el servidor caído)', () => {
      let error: unknown;
      servicio.getById(3).subscribe({ error: (e) => (error = e) });
      http.expectOne(`${API}/3`).flush('', { status: 500, statusText: 'Server Error' });
      expect((error as { status: number }).status).toBe(500);
    });

    it('no pide nada si el id no es un entero', () => {
      let resultado: Empleado | null | undefined;
      servicio.getById(Number('abc')).subscribe((e) => (resultado = e));
      http.expectNone(API);
      expect(resultado).toBeNull();
    });
  });
});
