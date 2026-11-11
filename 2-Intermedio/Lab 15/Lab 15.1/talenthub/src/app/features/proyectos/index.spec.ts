import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import * as proyectos from '@features/proyectos';

describe('barrel de la feature proyectos', () => {
  it('expone exactamente su API pública (valores)', () => {
    expect(Object.keys(proyectos)).toEqual(['ProyectoService']);
  });

  it('el servicio se puede inyectar', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    expect(TestBed.inject(proyectos.ProyectoService)).toBeTruthy();
  });
});
