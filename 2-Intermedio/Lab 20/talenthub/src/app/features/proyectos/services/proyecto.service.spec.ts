import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NOTIFICAR_404 } from '@core/interceptors/http-context';
import { Proyecto } from '../models/proyecto.model';
import { ProyectoService } from './proyecto.service';

const API = 'http://localhost:8000/projects';
const todo = (id: number, status = 'active') => ({
  id,
  name: `Proyecto ${id}`,
  client: 'Acme Corp',
  status,
  startDate: '2026-01-01',
  endDate: status === 'completed' ? '2026-03-01' : null,
  memberIds: [id],
});

describe('ProyectoService', () => {
  let servicio: ProyectoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(ProyectoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('getAll pide todos los proyectos de /projects y los mapea a Proyecto', () => {
    let resultado: Proyecto[] = [];
    servicio.getAll().subscribe((p) => (resultado = p));
    const req = http.expectOne((r) => r.url === API);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush([todo(1), todo(2, 'completed')]);
    expect(resultado.map((p) => [p.nombre, p.estado])).toEqual([
      ['Proyecto 1', 'activo'],
      ['Proyecto 2', 'completado'],
    ]);
  });

  it('getAll reintenta 2 veces (1 s y 2 s) ante un error del servidor', fakeAsync(() => {
    let resultado: Proyecto[] | undefined;
    servicio.getAll().subscribe((p) => (resultado = p));
    http.expectOne((r) => r.url === API).flush('', { status: 500, statusText: 'x' });
    tick(1000);
    http.expectOne((r) => r.url === API).flush('', { status: 500, statusText: 'x' });
    tick(2000);
    http.expectOne((r) => r.url === API).flush([todo(1)]);
    expect(resultado?.length).toBe(1);
  }));

  it('getAll descarta lo inválido y tolera lo que no es una lista', () => {
    let resultado: Proyecto[] = [];
    servicio.getAll().subscribe((p) => (resultado = p));
    http.expectOne((r) => r.url === API).flush([todo(1), { id: 'x' }]);
    expect(resultado.length).toBe(1);
    servicio.getAll().subscribe((p) => (resultado = p));
    http.expectOne((r) => r.url === API).flush('nada');
    expect(resultado).toEqual([]);
  });

  describe('getById', () => {
    it('devuelve el proyecto', () => {
      let resultado: Proyecto | null | undefined;
      servicio.getById(7).subscribe((p) => (resultado = p));
      http.expectOne(`${API}/7`).flush(todo(7));
      expect(resultado?.nombre).toBe('Proyecto 7');
    });

    it('devuelve null cuando no existe (404) y no hace que el interceptor avise', () => {
      let resultado: Proyecto | null | undefined;
      servicio.getById(999).subscribe((p) => (resultado = p));
      const req = http.expectOne(`${API}/999`);
      expect(req.request.context.get(NOTIFICAR_404)).toBeFalse();
      req.flush('', { status: 404, statusText: 'x' });
      expect(resultado).toBeNull();
    });

    it('propaga los demás errores y no pide nada con un id que no es entero', () => {
      let error: { status: number } | undefined;
      servicio.getById(1).subscribe({ error: (e) => (error = e) });
      http.expectOne(`${API}/1`).flush('', { status: 500, statusText: 'x' });
      expect(error?.status).toBe(500);

      let resultado: Proyecto | null | undefined;
      servicio.getById(Number('abc')).subscribe((p) => (resultado = p));
      expect(resultado).toBeNull();
    });
  });
});
