import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Empleado } from '../models/empleado.model';
import { EmpleadoService } from '../services/empleado.service';
import { empleadoResolver } from './empleado.resolver';

const empleado: Empleado = {
  id: 1,
  nombre: 'Ana',
  email: 'ana@example.com',
  rol: 'desarrollador',
  habilidades: [],
  disponible: true,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
};

describe('empleadoResolver', () => {
  const ejecutar = (id: string, getById: (id: number) => Observable<Empleado | null>) => {
    TestBed.configureTestingModule({ providers: [{ provide: EmpleadoService, useValue: { getById } }] });
    const ruta = { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
    let resultado: Empleado | null | undefined;
    (TestBed.runInInjectionContext(() => empleadoResolver(ruta, {} as never)) as Observable<Empleado | null>).subscribe(
      (e) => (resultado = e),
    );
    return resultado;
  };

  it('entrega el empleado del parámetro :id', () => {
    const pedido: number[] = [];
    const resultado = ejecutar('1', (id) => {
      pedido.push(id);
      return of(empleado);
    });
    expect(pedido).toEqual([1]);
    expect(resultado).toBe(empleado);
  });

  it('entrega null si el empleado no existe', () => {
    expect(ejecutar('999', () => of(null))).toBeNull();
  });

  it('entrega null (no rompe la navegación) si la petición falla', () => {
    expect(ejecutar('1', () => throwError(() => new Error('servidor caído')))).toBeNull();
  });
});
