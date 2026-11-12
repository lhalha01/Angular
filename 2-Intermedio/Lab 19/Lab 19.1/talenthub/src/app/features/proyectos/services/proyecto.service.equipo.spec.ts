import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MiembroEquipo } from '../models/proyecto.model';
import { ProyectoService } from './proyecto.service';

const USERS = 'http://localhost:8000/users';
const usuarios = [
  { id: 1, name: 'Leanne Graham', email: 'a@a.com' },
  { id: 3, name: 'Clementine Bauch', email: 'c@c.com' },
];

describe('ProyectoService.getEquipo', () => {
  let servicio: ProyectoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(ProyectoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('pide a /users los asignados al proyecto (projectId) y devuelve sus nombres', () => {
    let equipo: MiembroEquipo[] = [];
    servicio.getEquipo(8).subscribe((e) => (equipo = e));
    const req = http.expectOne((r) => r.url === USERS);
    expect(req.request.params.get('projectId')).toBe('8');
    req.flush(usuarios);
    expect(equipo).toEqual([
      { id: 1, nombre: 'Leanne Graham' },
      { id: 3, nombre: 'Clementine Bauch' },
    ]);
  });

  it('descarta lo inválido y tolera lo que no es una lista', () => {
    let equipo: MiembroEquipo[] | undefined;
    servicio.getEquipo(8).subscribe((e) => (equipo = e));
    http.expectOne((r) => r.url === USERS).flush('nada');
    expect(equipo).toEqual([]);
  });

  it('si el servidor falla (500) reintenta, como el resto de lecturas, y acaba entregando los datos', fakeAsync(() => {
    let equipo: MiembroEquipo[] = [];
    servicio.getEquipo(8).subscribe((e) => (equipo = e));
    http.expectOne((r) => r.url === USERS).flush('error', { status: 500, statusText: 'Server Error' });
    tick(1000);
    http.expectOne((r) => r.url === USERS).flush(usuarios);
    expect(equipo.length).toBe(2);
  }));
});
