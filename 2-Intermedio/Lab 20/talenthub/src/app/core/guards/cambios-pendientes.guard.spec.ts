import { TestBed } from '@angular/core/testing';
import { cambiosPendientesGuard } from './cambios-pendientes.guard';

describe('cambiosPendientesGuard', () => {
  const ejecutar = (cambios: boolean) =>
    TestBed.runInInjectionContext(() =>
      cambiosPendientesGuard({ tieneCambiosPendientes: () => cambios }, {} as never, {} as never, {} as never),
    );

  it('permite salir sin preguntar si no hay cambios', () => {
    const confirmar = spyOn(window, 'confirm');
    expect(ejecutar(false)).toBeTrue();
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('con cambios pregunta y deja salir si el usuario acepta', () => {
    const confirmar = spyOn(window, 'confirm').and.returnValue(true);
    expect(ejecutar(true)).toBeTrue();
    expect(confirmar).toHaveBeenCalledOnceWith('¿Salir sin guardar los cambios?');
  });

  it('con cambios pregunta y bloquea la salida si el usuario cancela', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    expect(ejecutar(true)).toBeFalse();
  });
});
