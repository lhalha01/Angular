import { TestBed } from '@angular/core/testing';
import { NotificacionService } from '@core/services/notificacion.service';
import { Notificaciones } from './notificaciones.component';

describe('Notificaciones', () => {
  function crear() {
    TestBed.configureTestingModule({ imports: [Notificaciones] });
    const fixture = TestBed.createComponent(Notificaciones);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, servicio: TestBed.inject(NotificacionService) };
  }

  it('no pinta nada si no hay avisos', () => {
    expect(crear().el.querySelectorAll('.aviso').length).toBe(0);
  });

  it('pinta cada aviso con su mensaje y su tipo', () => {
    const { fixture, el, servicio } = crear();
    servicio.error('No se pudo conectar');
    servicio.exito('Guardado');
    fixture.detectChanges();

    const avisos = Array.from(el.querySelectorAll('.aviso'));
    expect(avisos.map((a) => a.textContent?.replace('✕', '').trim())).toEqual(['No se pudo conectar', 'Guardado']);
    expect(avisos[0].classList).toContain('aviso--error');
    expect(avisos[1].classList).toContain('aviso--exito');
  });

  it('los errores se anuncian con role="alert" y el resto con role="status"', () => {
    const { fixture, el, servicio } = crear();
    servicio.error('mal');
    servicio.info('ojo');
    fixture.detectChanges();
    expect(Array.from(el.querySelectorAll('.aviso')).map((a) => a.getAttribute('role'))).toEqual(['alert', 'status']);
  });

  it('el botón de cierre quita el aviso', () => {
    const { fixture, el, servicio } = crear();
    servicio.error('mal');
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.aviso button')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.aviso').length).toBe(0);
    expect(servicio.lista()).toEqual([]);
  });
});
