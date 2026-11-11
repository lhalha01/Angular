import { TestBed } from '@angular/core/testing';
// La feature se importa a través de su alias y su barrel, que es lo que hará el resto de la aplicación.
import * as empleados from '@features/empleados';

describe('barrel de la feature empleados', () => {
  it('expone exactamente su API pública (valores)', () => {
    expect(Object.keys(empleados).sort()).toEqual(['EmpleadoService', 'esEmpleado', 'mapearEmpleado']);
  });

  it('lo que expone funciona', () => {
    const e = empleados.mapearEmpleado({
      id: 4,
      name: 'Ervin Howell',
      email: 'e@h.com',
      phone: '',
      website: '',
      company: { name: 'X' },
    });
    expect(empleados.esEmpleado(e)).toBeTrue();
    expect(TestBed.inject(empleados.EmpleadoService)).toBeTruthy();
  });

  it('no expone el DTO de la API (solo lo conoce el mapper)', () => {
    // @ts-expect-error `EmpleadoDto` no forma parte de la API pública de la feature
    type Fuga = import('@features/empleados').EmpleadoDto;
    const sinUsar: Fuga | undefined = undefined;
    expect(sinUsar).toBeUndefined();
  });
});
