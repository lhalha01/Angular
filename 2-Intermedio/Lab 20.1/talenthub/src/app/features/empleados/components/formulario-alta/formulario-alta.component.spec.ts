import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NotificacionService } from '@core/services/notificacion.service';
import { Proyecto, ProyectoService } from '@features/proyectos';
import { ESPERA_EMAIL_UNICO_MS } from '@shared/validators/email-unico.validator';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Empleado, NuevoEmpleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';
import { FormularioAlta } from './formulario-alta.component';

const proyecto = (id: number, nombre: string): Proyecto => ({
  id,
  nombre,
  cliente: 'Cliente 1',
  estado: 'activo',
  fechaInicio: new Date(2026, 0, 1),
  fechaFin: null,
  empleadosIds: [1],
});
const PROYECTOS = [proyecto(1, 'Migración'), proyecto(2, 'Rediseño')];
const creado = (datos: NuevoEmpleado): Empleado => ({ ...datos, id: 11, fechaIncorporacion: new Date(2026, 0, 1) });

describe('FormularioAlta (Reactive Forms)', () => {
  let crear: jasmine.Spy<(d: NuevoEmpleado) => Observable<Empleado>>;
  let navegar: jasmine.Spy;
  let fixture: ComponentFixture<FormularioAlta>;
  let el: HTMLElement;

  function montar(respuesta: (d: NuevoEmpleado) => Observable<Empleado> = () => new Subject<Empleado>(), proyectos: Observable<Proyecto[]> = of(PROYECTOS)) {
    crear = jasmine.createSpy('crear').and.callFake(respuesta);
    TestBed.configureTestingModule({
      imports: [FormularioAlta],
      providers: [
        provideRouter([]),
        { provide: EmpleadoService, useValue: { crear } },
        { provide: ProyectoService, useValue: { getAll: () => proyectos } },
      ],
    });
    navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(FormularioAlta);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    return fixture.componentInstance;
  }

  const campo = (selector: string) => el.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
  const escribir = (selector: string, valor: string, evento: 'input' | 'change' = 'input') => {
    const c = campo(selector);
    c.value = valor;
    c.dispatchEvent(new Event(evento));
    fixture.detectChanges();
  };
  const tocar = (selector: string) => {
    campo(selector).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  const marcar = (selector: string, valor: boolean) => {
    const c = campo(selector) as HTMLInputElement;
    c.checked = valor;
    c.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const errores = () => Array.from(el.querySelectorAll('.error')).map((e) => e.textContent?.replace(/\s+/g, ' ').trim());
  const boton = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const enviar = () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };
  /** Rellena un empleado válido; el email tarda 400 ms en validarse. */
  const rellenarValido = () => {
    escribir('#nombre', 'Marta Ruiz');
    escribir('#email', 'marta@example.com');
    tick(ESPERA_EMAIL_UNICO_MS);
    fixture.detectChanges();
  };

  describe('errores de validación (solo tras tocar el campo o intentar enviar)', () => {
    it('al empezar no se muestra ningún error', () => {
      montar();
      expect(errores()).toEqual([]);
    });

    it('el nombre obligatorio se señala al tocarlo y dejarlo vacío', () => {
      montar();
      tocar('#nombre');
      expect(errores()).toEqual(['El nombre es obligatorio.']);
    });

    it('un nombre formado solo por espacios cuenta como vacío (no basta con required)', () => {
      montar();
      escribir('#nombre', '    ');
      tocar('#nombre');
      expect(errores()).toEqual(['El nombre es obligatorio.']);
    });

    it('el email no admite espacios (se avisa de ello antes que del formato)', fakeAsync(() => {
      montar();
      escribir('#email', 'ana @example.com');
      tocar('#email');
      expect(errores()).toEqual(['El email no puede contener espacios.']);
      escribir('#email', 'ana@example.com');
      tick(ESPERA_EMAIL_UNICO_MS);
      fixture.detectChanges();
      expect(errores()).toEqual([]);
    }));

    it('el nombre solo admite letras y espacios', () => {
      montar();
      escribir('#nombre', 'R2-D2');
      tocar('#nombre');
      expect(errores()).toEqual(['Solo se admiten letras y espacios.']);
      escribir('#nombre', 'José Ángel');
      expect(errores()).toEqual([]);
    });

    it('el email obligatorio y con formato válido', fakeAsync(() => {
      montar();
      tocar('#email');
      expect(errores()).toEqual(['El email es obligatorio.']);
      escribir('#email', 'esto-no-es-un-email');
      expect(errores()).toEqual(['El email no tiene un formato válido.']);
    }));

    it('un campo no tocado no muestra error aunque sea inválido', () => {
      montar();
      escribir('#nombre', 'Ana2'); // inválido, pero sin blur
      expect(errores()).toEqual([]);
    });

    it('al intentar enviar se muestran todos los errores a la vez y no se envía nada', () => {
      montar();
      enviar();
      expect(errores()).toEqual(['El nombre es obligatorio.', 'El email es obligatorio.']);
      expect(crear).not.toHaveBeenCalled();
    });

    it('los campos inválidos y tocados se marcan para los lectores de pantalla (role=alert)', () => {
      montar();
      tocar('#nombre');
      expect(el.querySelector('.error')?.getAttribute('role')).toBe('alert');
    });
  });

  describe('validador asíncrono del email', () => {
    it('muestra «comprobando» mientras valida y luego acepta un email normal', fakeAsync(() => {
      montar();
      escribir('#email', 'ana@example.com');
      expect(el.textContent).toContain('Comprobando el email');
      tick(ESPERA_EMAIL_UNICO_MS);
      fixture.detectChanges();
      expect(el.textContent).not.toContain('Comprobando');
      expect(errores()).toEqual([]);
    }));

    it('marca como duplicado cualquier email que contenga «test»', fakeAsync(() => {
      montar();
      escribir('#email', 'test@example.com');
      tick(ESPERA_EMAIL_UNICO_MS);
      fixture.detectChanges();
      tocar('#email');
      expect(errores()).toEqual(['Ese email ya está en uso.']);
    }));

    it('no consulta si el formato ya es inválido (el asíncrono solo corre con los síncronos en regla)', fakeAsync(() => {
      const c = montar();
      escribir('#email', 'test-sin-arroba');
      tick(ESPERA_EMAIL_UNICO_MS);
      expect(c.form.controls.email.hasError('emailDuplicado')).toBeFalse();
      expect(c.form.controls.email.hasError('email')).toBeTrue();
    }));

    it('con el email aún en comprobación no se envía', fakeAsync(() => {
      montar();
      escribir('#nombre', 'Marta Ruiz');
      escribir('#email', 'marta@example.com');
      enviar(); // sin esperar los 400 ms
      expect(crear).not.toHaveBeenCalled();
      tick(ESPERA_EMAIL_UNICO_MS);
    }));
  });

  describe('validación cruzada: disponible y proyecto', () => {
    it('un empleado no disponible sin proyecto muestra el error del grupo', () => {
      montar();
      marcar('#disponible', false);
      tocar('#proyecto');
      expect(errores()).toEqual(['Un empleado que no está disponible debe tener un proyecto asignado.']);
    });

    it('el error desaparece al asignar un proyecto o al volver a estar disponible', () => {
      montar();
      marcar('#disponible', false);
      tocar('#proyecto');
      escribir('#proyecto', '1', 'change'); // el valor de un <select> con ngValue se identifica por posición
      const select = campo('#proyecto') as HTMLSelectElement;
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(errores()).toEqual([]);

      select.selectedIndex = 0; // «Sin proyecto»
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(errores().length).toBe(1);
      marcar('#disponible', true);
      expect(errores()).toEqual([]);
    });

    it('el error es del grupo (el botón de enviar lo respeta) y no de un campo', () => {
      const c = montar();
      marcar('#disponible', false);
      expect(c.form.hasError('proyectoObligatorio')).toBeTrue();
      expect(c.form.controls.proyectoActualId.errors).toBeNull();
    });

    it('al intentar enviar se muestra aunque no se haya tocado nada', () => {
      montar();
      marcar('#disponible', false);
      enviar();
      expect(errores()).toContain('Un empleado que no está disponible debe tener un proyecto asignado.');
    });

    it('ofrece «Sin proyecto» y los proyectos de la API', () => {
      montar();
      const opciones = Array.from(el.querySelectorAll('#proyecto option')).map((o) => o.textContent?.trim());
      expect(opciones).toEqual(['Sin proyecto', 'Migración', 'Rediseño']);
    });

    it('si los proyectos no cargan, «Sin proyecto» sigue disponible', () => {
      montar(undefined, throwError(() => new Error('sin conexión')));
      expect(Array.from(el.querySelectorAll('#proyecto option')).map((o) => o.textContent?.trim())).toEqual(['Sin proyecto']);
    });
  });

  describe('habilidades (FormArray)', () => {
    const anadir = () => {
      el.querySelector<HTMLButtonElement>('button.secundario')!.click();
      fixture.detectChanges();
    };
    const filas = () => el.querySelectorAll('.habilidad');

    it('al empezar no hay ninguna', () => {
      montar();
      expect(filas().length).toBe(0);
      expect(el.textContent).toContain('Sin habilidades todavía');
    });

    it('se pueden añadir y eliminar dinámicamente', () => {
      montar();
      anadir();
      anadir();
      anadir();
      expect(filas().length).toBe(3);

      el.querySelectorAll<HTMLButtonElement>('.quitar')[1].click(); // quita la del medio
      fixture.detectChanges();
      expect(filas().length).toBe(2);
    });

    it('al quitar una se conservan los valores de las demás', () => {
      montar();
      anadir();
      anadir();
      anadir();
      const nombres = Array.from(el.querySelectorAll<HTMLInputElement>('.habilidad input'));
      ['Angular', 'RxJS', 'Docker'].forEach((n, i) => {
        nombres[i].value = n;
        nombres[i].dispatchEvent(new Event('input'));
      });
      el.querySelectorAll<HTMLButtonElement>('.quitar')[1].click();
      fixture.detectChanges();
      expect(Array.from(el.querySelectorAll<HTMLInputElement>('.habilidad input')).map((i) => i.value)).toEqual(['Angular', 'Docker']);
    });

    it('cada habilidad empieza en nivel «mid» y se puede cambiar', () => {
      montar();
      anadir();
      const nivel = el.querySelector<HTMLSelectElement>('.habilidad select')!;
      expect(nivel.value).toBe('mid');
      nivel.value = 'senior';
      nivel.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(nivel.value).toBe('senior');
    });

    it('el nombre de la habilidad es obligatorio y de 30 caracteres como máximo', () => {
      montar();
      anadir();
      const nombre = el.querySelector<HTMLInputElement>('.habilidad input')!;
      nombre.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(errores()).toEqual(['Escribe la habilidad.']);

      nombre.value = 'x'.repeat(31);
      nombre.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(errores()).toEqual(['Máximo 30 caracteres.']);

      nombre.value = 'x'.repeat(30);
      nombre.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(errores()).toEqual([]);
    });

    it('una habilidad vacía impide enviar y se señala al intentarlo', fakeAsync(() => {
      montar();
      rellenarValido();
      anadir();
      enviar();
      expect(crear).not.toHaveBeenCalled();
      expect(errores()).toEqual(['Escribe la habilidad.']);
    }));

    it('los controles tienen un nombre accesible que incluye su número', () => {
      montar();
      anadir();
      anadir();
      expect(Array.from(el.querySelectorAll('.quitar')).map((b) => b.getAttribute('aria-label'))).toEqual([
        'Quitar la habilidad 1',
        'Quitar la habilidad 2',
      ]);
    });

    it('añadir o quitar una habilidad cuenta como cambio pendiente', () => {
      const c = montar();
      expect(c.tieneCambiosPendientes()).toBeFalse();
      anadir();
      expect(c.tieneCambiosPendientes()).toBeTrue();
    });
  });

  describe('envío', () => {
    it('envía el alta con todos los datos del formulario (recortados)', fakeAsync(() => {
      montar();
      escribir('#nombre', '  Marta   Ruiz ');
      escribir('#email', ' marta@example.com ');
      escribir('#rol', 'qa', 'change');
      el.querySelector<HTMLButtonElement>('button.secundario')!.click();
      fixture.detectChanges();
      const habilidad = el.querySelector<HTMLInputElement>('.habilidad input')!;
      habilidad.value = ' Cypress ';
      habilidad.dispatchEvent(new Event('input'));
      const select = campo('#proyecto') as HTMLSelectElement;
      select.selectedIndex = 2;
      select.dispatchEvent(new Event('change'));
      tick(ESPERA_EMAIL_UNICO_MS);
      fixture.detectChanges();

      enviar();
      expect(crear).toHaveBeenCalledOnceWith({
        nombre: 'Marta Ruiz',
        email: 'marta@example.com',
        rol: 'qa',
        habilidades: [{ nombre: 'Cypress', nivel: 'mid' }],
        disponible: true,
        proyectoActualId: 2,
      });
    }));

    it('el botón se desactiva mientras se procesa y se reactiva si falla', fakeAsync(() => {
      const respuesta = new Subject<Empleado>();
      montar(() => respuesta);
      rellenarValido();
      expect(boton().disabled).toBeFalse();
      enviar();
      expect(boton().disabled).toBeTrue();
      expect(boton().textContent).toContain('Dando de alta');
      respuesta.error(new Error('500'));
      flushMicrotasks(); // la fachada resuelve su promesa
      fixture.detectChanges();
      expect(boton().disabled).toBeFalse();
    }));

    it('pulsar varias veces seguidas crea un solo empleado (exhaustMap)', fakeAsync(() => {
      montar(() => new Subject<Empleado>());
      rellenarValido();
      enviar();
      enviar();
      enviar();
      expect(crear).toHaveBeenCalledTimes(1);
    }));

    it('tras crearse avisa, vuelve al directorio y no pide confirmar al salir', fakeAsync(() => {
      const respuesta = new Subject<Empleado>();
      const c = montar(() => respuesta);
      rellenarValido();
      expect(c.tieneCambiosPendientes()).toBeTrue();
      enviar();
      respuesta.next(creado({ nombre: 'Marta Ruiz', email: 'marta@example.com', rol: 'desarrollador', habilidades: [], disponible: true, proyectoActualId: null }));
      respuesta.complete();
      flushMicrotasks();
      expect(TestBed.inject(NotificacionService).lista().map((n) => n.mensaje)).toEqual(['Marta Ruiz incorporado correctamente']);
      expect(navegar).toHaveBeenCalledOnceWith(['/empleados']);
      expect(c.tieneCambiosPendientes()).toBeFalse();
    }));

    it('si el alta falla no navega y se puede reintentar (el flujo sigue vivo)', fakeAsync(() => {
      let intento = 0;
      const exito = new Subject<Empleado>();
      montar(() => (++intento === 1 ? throwError(() => new Error('500')) : exito));
      rellenarValido();
      enviar();
      flushMicrotasks();
      expect(navegar).not.toHaveBeenCalled();
      enviar();
      expect(crear).toHaveBeenCalledTimes(2);
      exito.next(creado({ nombre: 'M', email: 'm@m.com', rol: 'desarrollador', habilidades: [], disponible: true, proyectoActualId: null }));
      exito.complete(); // `lastValueFrom` espera a que la petición termine, como hace HttpClient
      flushMicrotasks();
      expect(navegar).toHaveBeenCalledTimes(1);
    }));

    it('al destruirse cierra el flujo y deja de atender envíos', () => {
      const c = montar();
      fixture.destroy();
      c.envio$.next({ nombre: 'A', email: 'a@a.com', rol: 'qa', habilidades: [], disponible: true, proyectoActualId: null });
      expect(crear).not.toHaveBeenCalled();
    });
  });

  describe('cambios pendientes', () => {
    it('al empezar no hay; escribir en cualquier campo los genera', () => {
      const c = montar();
      expect(c.tieneCambiosPendientes()).toBeFalse();
      escribir('#nombre', 'M');
      expect(c.tieneCambiosPendientes()).toBeTrue();
    });
  });
});
