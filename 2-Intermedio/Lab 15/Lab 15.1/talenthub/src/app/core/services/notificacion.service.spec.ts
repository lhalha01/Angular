import { fakeAsync, tick } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  let servicio: NotificacionService;
  beforeEach(() => (servicio = TestBed.inject(NotificacionService)));

  it('empieza sin avisos', () => {
    expect(servicio.lista()).toEqual([]);
  });

  it('muestra avisos de éxito, error e info, cada uno con su tipo', () => {
    servicio.exito('hecho');
    servicio.error('fallo');
    servicio.info('ojo');
    expect(servicio.lista().map((n) => [n.tipo, n.mensaje])).toEqual([
      ['exito', 'hecho'],
      ['error', 'fallo'],
      ['info', 'ojo'],
    ]);
  });

  it('no repite un mismo mensaje mientras siga visible (reintentos de una petición)', () => {
    servicio.error('sin conexión');
    servicio.error('sin conexión');
    servicio.error('sin conexión');
    expect(servicio.lista().length).toBe(1);
  });

  it('sí admite el mismo texto con otro tipo, o uno distinto del mismo tipo', () => {
    servicio.error('x');
    servicio.info('x');
    servicio.error('y');
    expect(servicio.lista().length).toBe(3);
  });

  it('cerrar elimina solo ese aviso', () => {
    servicio.error('a');
    servicio.error('b');
    servicio.cerrar(servicio.lista()[0].id);
    expect(servicio.lista().map((n) => n.mensaje)).toEqual(['b']);
  });

  it('los avisos se cierran solos: 5 s los normales y 8 s los de error', fakeAsync(() => {
    servicio.exito('ok');
    servicio.error('mal');
    tick(5000);
    expect(servicio.lista().map((n) => n.mensaje)).toEqual(['mal']);
    tick(3000);
    expect(servicio.lista()).toEqual([]);
  }));

  it('tras cerrarse un aviso, el mismo mensaje puede volver a mostrarse', fakeAsync(() => {
    servicio.error('mal');
    tick(8000);
    servicio.error('mal');
    expect(servicio.lista().length).toBe(1);
  }));

  it('ngOnDestroy cancela los temporizadores pendientes', fakeAsync(() => {
    servicio.error('mal');
    servicio.ngOnDestroy();
    tick(10000); // si quedara algún temporizador, fakeAsync lo señalaría al terminar
    expect(servicio.lista().length).toBe(1);
  }));
});
