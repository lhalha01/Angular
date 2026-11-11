import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NotificacionService } from '@core/services/notificacion.service';
import { Observable, Subject, throwError } from 'rxjs';
import { Empleado, NuevoEmpleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';
import { FormularioAlta } from './formulario-alta.component';

const creado = (datos: NuevoEmpleado): Empleado => ({ ...datos, id: 11, fechaIncorporacion: new Date(2026, 0, 1) });

describe('FormularioAlta', () => {
  let crear: jasmine.Spy<(d: NuevoEmpleado) => Observable<Empleado>>;
  let navegar: jasmine.Spy;

  function montar(respuesta: (d: NuevoEmpleado) => Observable<Empleado>) {
    crear = jasmine.createSpy('crear').and.callFake(respuesta);
    TestBed.configureTestingModule({
      imports: [FormularioAlta],
      providers: [provideRouter([]), { provide: EmpleadoService, useValue: { crear } }],
    });
    navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(FormularioAlta);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const escribir = (name: string, valor: string) => {
      const input = el.querySelector<HTMLInputElement>(`input[name=${name}]`)!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const boton = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;
    const enviar = () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
    };
    return { fixture, el, escribir, boton, enviar, componente: fixture.componentInstance };
  }

  describe('cambios pendientes', () => {
    it('al empezar no hay cambios pendientes', () => {
      expect(montar(() => new Subject()).componente.tieneCambiosPendientes()).toBeFalse();
    });

    it('escribir en el nombre o en el email genera cambios pendientes; vaciarlos, no', () => {
      const m = montar(() => new Subject());
      m.escribir('nombre', 'Marta');
      expect(m.componente.tieneCambiosPendientes()).toBeTrue();
      m.escribir('nombre', '   ');
      expect(m.componente.tieneCambiosPendientes()).toBeFalse();
      m.escribir('email', 'm@example.com');
      expect(m.componente.tieneCambiosPendientes()).toBeTrue();
    });
  });

  describe('envío', () => {
    it('el botón está desactivado hasta que hay nombre y email', () => {
      const m = montar(() => new Subject());
      expect(m.boton().disabled).toBeTrue();
      m.escribir('nombre', 'Marta Ruiz');
      expect(m.boton().disabled).toBeTrue();
      m.escribir('email', 'marta@example.com');
      expect(m.boton().disabled).toBeFalse();
    });

    it('envía el alta con los datos del formulario y los valores por defecto', () => {
      const m = montar(() => new Subject<Empleado>());
      m.escribir('nombre', '  Marta Ruiz ');
      m.escribir('email', 'marta@example.com');
      m.enviar();
      expect(crear).toHaveBeenCalledOnceWith({
        nombre: 'Marta Ruiz',
        email: 'marta@example.com',
        rol: 'desarrollador',
        habilidades: [],
        disponible: true,
        proyectoActualId: null,
      });
    });

    it('sin nombre y email no envía nada', () => {
      const m = montar(() => new Subject());
      m.escribir('nombre', 'Marta');
      m.enviar();
      expect(crear).not.toHaveBeenCalled();
    });

    it('tras crearse avisa, vuelve al directorio y ya no hay cambios pendientes (no se pide confirmar)', () => {
      const respuesta = new Subject<Empleado>();
      const m = montar(() => respuesta);
      m.escribir('nombre', 'Marta Ruiz');
      m.escribir('email', 'marta@example.com');
      m.enviar();
      respuesta.next(creado({ nombre: 'Marta Ruiz', email: 'marta@example.com', rol: 'desarrollador', habilidades: [], disponible: true, proyectoActualId: null }));
      respuesta.complete();

      expect(TestBed.inject(NotificacionService).lista().map((n) => n.mensaje)).toEqual(['Marta Ruiz incorporado correctamente']);
      expect(navegar).toHaveBeenCalledOnceWith(['/empleados']);
      expect(m.componente.tieneCambiosPendientes()).toBeFalse();
    });
  });

  describe('protección de doble envío (exhaustMap)', () => {
    it('pulsar varias veces seguidas crea un solo empleado', () => {
      const respuesta = new Subject<Empleado>();
      const m = montar(() => respuesta);
      m.escribir('nombre', 'Marta Ruiz');
      m.escribir('email', 'marta@example.com');
      m.enviar();
      m.enviar();
      m.enviar();
      expect(crear).toHaveBeenCalledTimes(1);
    });

    it('mientras se envía el botón está desactivado', () => {
      const m = montar(() => new Subject());
      m.escribir('nombre', 'Marta Ruiz');
      m.escribir('email', 'marta@example.com');
      m.enviar();
      expect(m.boton().disabled).toBeTrue();
    });

    it('el flujo también ignora los envíos que llegan por otra vía mientras hay uno en curso', () => {
      const m = montar(() => new Subject());
      const datos: NuevoEmpleado = { nombre: 'A', email: 'a@a.com', rol: 'qa', habilidades: [], disponible: true, proyectoActualId: null };
      m.componente.envio$.next(datos);
      m.componente.envio$.next(datos);
      expect(crear).toHaveBeenCalledTimes(1);
    });
  });

  describe('si el alta falla', () => {
    it('no navega, no avisa de éxito, reactiva el botón y se puede reintentar (el flujo sigue vivo)', () => {
      let intento = 0;
      const exito = new Subject<Empleado>();
      const m = montar(() => (++intento === 1 ? throwError(() => new Error('500')) : exito));
      m.escribir('nombre', 'Marta Ruiz');
      m.escribir('email', 'marta@example.com');

      m.enviar();
      expect(navegar).not.toHaveBeenCalled();
      expect(TestBed.inject(NotificacionService).lista()).toEqual([]); // el aviso del error lo da el interceptor
      expect(m.boton().disabled).toBeFalse();
      expect(m.componente.tieneCambiosPendientes()).toBeTrue(); // sigue sin guardar

      m.enviar(); // reintento
      expect(crear).toHaveBeenCalledTimes(2);
      exito.next(creado({ nombre: 'Marta Ruiz', email: 'marta@example.com', rol: 'desarrollador', habilidades: [], disponible: true, proyectoActualId: null }));
      expect(navegar).toHaveBeenCalledOnceWith(['/empleados']);
    });
  });

  describe('al destruirse', () => {
    it('cierra el flujo (takeUntilDestroyed) y deja de atender envíos', () => {
      const m = montar(() => new Subject());
      m.fixture.destroy();
      m.componente.envio$.next({ nombre: 'A', email: 'a@a.com', rol: 'qa', habilidades: [], disponible: true, proyectoActualId: null });
      expect(crear).not.toHaveBeenCalled();
    });
  });
});
