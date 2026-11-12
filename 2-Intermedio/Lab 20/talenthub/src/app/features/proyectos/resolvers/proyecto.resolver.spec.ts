import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Proyecto } from '../models/proyecto.model';
import { ProyectoService } from '../services/proyecto.service';
import { proyectoResolver } from './proyecto.resolver';

const proyecto: Proyecto = {
  id: 3,
  nombre: 'Migración',
  cliente: 'Acme Corp',
  estado: 'activo',
  fechaInicio: new Date(2026, 0, 1),
  fechaFin: null,
  empleadosIds: [],
};

describe('proyectoResolver', () => {
  const ejecutar = (id: string, getById: (id: number) => Observable<Proyecto | null>) => {
    TestBed.configureTestingModule({ providers: [{ provide: ProyectoService, useValue: { getById } }] });
    const ruta = { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
    let resultado: Proyecto | null | undefined;
    (TestBed.runInInjectionContext(() => proyectoResolver(ruta, {} as never)) as Observable<Proyecto | null>).subscribe(
      (p) => (resultado = p),
    );
    return resultado;
  };

  it('entrega el proyecto del parámetro :id', () => {
    const getById = jasmine.createSpy('getById').and.returnValue(of(proyecto));
    expect(ejecutar('3', getById)).toEqual(proyecto);
    expect(getById).toHaveBeenCalledOnceWith(3);
  });

  it('entrega null si el proyecto no existe', () => {
    expect(ejecutar('99', () => of(null))).toBeNull();
  });

  it('entrega null (no rompe la navegación) si la petición falla', () => {
    expect(ejecutar('3', () => throwError(() => new Error('500')))).toBeNull();
  });

  it('un id que no es un número se pasa tal cual al servicio (que responde null)', () => {
    const getById = jasmine.createSpy('getById').and.returnValue(of(null));
    expect(ejecutar('abc', getById)).toBeNull();
    expect(getById.calls.mostRecent().args[0]).toBeNaN();
  });
});
