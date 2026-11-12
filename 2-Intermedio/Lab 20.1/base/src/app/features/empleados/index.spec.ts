import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
// La feature se importa a través de su alias y su barrel, que es lo que hará el resto de la aplicación.
import * as empleados from '@features/empleados';

describe('barrel de la feature empleados', () => {
  it('expone exactamente su API pública (valores)', () => {
    expect(Object.keys(empleados).sort()).toEqual(['EmpleadoService', 'EmpleadosFacade', 'esEmpleado']);
  });

  it('lo que expone funciona', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const e = { id: 4, nombre: 'Ervin Howell', email: 'e@h.com', rol: 'qa' };
    expect(empleados.esEmpleado(e)).toBeTrue();
    expect(TestBed.inject(empleados.EmpleadoService)).toBeTruthy();
  });
});
