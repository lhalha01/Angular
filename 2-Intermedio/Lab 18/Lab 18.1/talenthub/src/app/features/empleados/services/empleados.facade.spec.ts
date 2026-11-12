import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NotificacionService } from '@core/services/notificacion.service';
import { Observable, Subject, defer, of, throwError } from 'rxjs';
import { Empleado, NuevoEmpleado, RolEmpleado } from '../models/empleado.model';
import { EmpleadoService } from './empleado.service';
import { EmpleadoStateService } from './empleado-state.service';
import { EmpleadosFacade } from './empleados.facade';

const empleado = (id: number, rol: RolEmpleado = 'desarrollador', disponible = true): Empleado => ({
  id,
  nombre: `Empleado ${id}`,
  email: `e${id}@example.com`,
  rol,
  habilidades: [],
  disponible,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
});
const NUEVO: NuevoEmpleado = { nombre: 'Marta Ruiz', email: 'marta@example.com', rol: 'qa', habilidades: [], disponible: true, proyectoActualId: null };

describe('EmpleadosFacade', () => {
  let service: { getAll: jasmine.Spy; getById: jasmine.Spy; crear: jasmine.Spy; eliminar: jasmine.Spy };
  let facade: EmpleadosFacade;
  let state: EmpleadoStateService;

  function montar() {
    service = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([empleado(1), empleado(2, 'qa', false)])),
      getById: jasmine.createSpy('getById'),
      crear: jasmine.createSpy('crear'),
      eliminar: jasmine.createSpy('eliminar'),
    };
    TestBed.configureTestingModule({ providers: [{ provide: EmpleadoService, useValue: service }] });
    facade = TestBed.inject(EmpleadosFacade);
    state = TestBed.inject(EmpleadoStateService);
  }
  beforeEach(montar);

  describe('estado expuesto', () => {
    it('es el del servicio de estado, en solo lectura', () => {
      state.setEmpleados([empleado(1), empleado(2, 'qa', false)]);
      expect(facade.empleados().length).toBe(2);
      expect(facade.disponibles().map((e) => e.id)).toEqual([1]);
      expect(facade.ocupados().map((e) => e.id)).toEqual([2]);
      expect(facade.totalPorRol().qa).toBe(1);
      expect((facade.empleados as unknown as { set?: unknown }).set).toBeUndefined();
    });
  });

  describe('cargar', () => {
    it('pide la lista al servicio y la deja en el estado', () => {
      facade.cargar();
      expect(service.getAll).toHaveBeenCalledOnceWith('');
      expect(facade.empleados().map((e) => e.id)).toEqual([1, 2]);
      expect(facade.cargando()).toBeFalse();
      expect(facade.error()).toBeNull();
    });

    it('no vuelve a pedir el mismo término si ya está cargado (ni mientras está en camino)', () => {
      facade.cargar();
      facade.cargar();
      facade.cargar('');
      expect(service.getAll).toHaveBeenCalledTimes(1);
      facade.cargar('ana');
      facade.cargar('ana');
      expect(service.getAll).toHaveBeenCalledTimes(2);
      facade.cargar(''); // volver al término anterior sí es una carga nueva
      expect(service.getAll).toHaveBeenCalledTimes(3);
    });

    it('con `forzar` pide de todos modos, y recargar() repite el último término', () => {
      facade.cargar('ana');
      facade.cargar('ana', { forzar: true });
      expect(service.getAll).toHaveBeenCalledTimes(2);
      facade.recargar();
      expect(service.getAll).toHaveBeenCalledTimes(3);
      expect(service.getAll.calls.mostRecent().args).toEqual(['ana']);
    });

    it('recargar() sin haber cargado nada pide la lista completa', () => {
      facade.recargar();
      expect(service.getAll).toHaveBeenCalledOnceWith('');
    });

    it('tras un error el mismo término se puede volver a pedir (reintento)', () => {
      service.getAll.and.returnValue(throwError(() => new Error('500')));
      facade.cargar();
      expect(facade.error()).not.toBeNull();
      service.getAll.and.returnValue(of([empleado(1)]));
      facade.cargar();
      expect(service.getAll).toHaveBeenCalledTimes(2);
      expect(facade.error()).toBeNull();
    });

    it('con un término lo pasa al servicio', () => {
      facade.cargar('ervin');
      expect(service.getAll).toHaveBeenCalledWith('ervin');
    });

    it('está «cargando» mientras llega la respuesta', () => {
      const respuesta = new Subject<Empleado[]>();
      service.getAll.and.returnValue(respuesta);
      facade.cargar();
      expect(facade.cargando()).toBeTrue();
      respuesta.next([empleado(7)]);
      respuesta.complete();
      expect(facade.cargando()).toBeFalse();
      expect(facade.empleados().map((e) => e.id)).toEqual([7]);
    });

    it('sustituye la lista anterior por la nueva', () => {
      facade.cargar();
      service.getAll.and.returnValue(of([empleado(9)]));
      facade.cargar('x');
      expect(facade.empleados().map((e) => e.id)).toEqual([9]);
    });

    it('si falla guarda el error, deja de cargar y conserva la lista que hubiera', () => {
      facade.cargar();
      service.getAll.and.returnValue(throwError(() => new Error('500')));
      facade.cargar('x');
      expect(facade.error()).toBe('No se pudieron cargar los empleados.');
      expect(facade.cargando()).toBeFalse();
      expect(facade.empleados().length).toBe(2); // no se pierde lo cargado
    });

    it('una carga correcta posterior limpia el error', () => {
      service.getAll.and.returnValue(throwError(() => new Error('500')));
      facade.cargar();
      expect(facade.error()).not.toBeNull();
      service.getAll.and.returnValue(of([empleado(1)]));
      facade.recargar();
      expect(facade.error()).toBeNull();
    });

    it('si llega otra carga con una en vuelo, cancela la anterior (switchMap) y su respuesta tardía se ignora', () => {
      const viejas = new Subject<Empleado[]>();
      let cancelada = false;
      service.getAll.and.callFake((t: string) =>
        t === 'a'
          ? defer(() => new Observable<Empleado[]>((obs) => {
              const sub = viejas.subscribe(obs);
              return () => {
                cancelada = !viejas.isStopped;
                sub.unsubscribe();
              };
            }))
          : of([empleado(2)]),
      );
      facade.cargar('a');
      expect(facade.cargando()).toBeTrue();
      facade.cargar('b');
      expect(cancelada).toBeTrue();
      viejas.next([empleado(1)]); // respuesta tardía de la búsqueda cancelada
      expect(facade.empleados().map((e) => e.id)).toEqual([2]);
      expect(facade.cargando()).toBeFalse();
    });

    it('«cargando» sigue encendido mientras haya una carga en vuelo aunque se cancele otra', () => {
      const lenta = new Subject<Empleado[]>();
      service.getAll.and.callFake((t: string) => (t === 'lenta' ? lenta : new Subject<Empleado[]>()));
      facade.cargar('x');
      facade.cargar('lenta');
      expect(facade.cargando()).toBeTrue();
      lenta.next([empleado(5)]);
      lenta.complete();
      expect(facade.cargando()).toBeFalse();
    });
  });

  describe('obtenerPorId', () => {
    it('devuelve lo que da el servicio (el empleado o null)', () => {
      service.getById.and.returnValue(of(empleado(3)));
      let resultado: Empleado | null | undefined;
      facade.obtenerPorId(3).subscribe((e) => (resultado = e));
      expect(service.getById).toHaveBeenCalledOnceWith(3);
      expect(resultado?.id).toBe(3);

      service.getById.and.returnValue(of(null));
      facade.obtenerPorId(999).subscribe((e) => (resultado = e));
      expect(resultado).toBeNull();
    });
  });

  describe('darDeAlta', () => {
    it('crea el empleado, lo añade a la lista SIN recargarla y avisa del éxito', fakeAsync(() => {
      state.setEmpleados([empleado(1)]);
      service.crear.and.returnValue(of(empleado(11)));
      let creado: Empleado | undefined;
      facade.darDeAlta(NUEVO).then((e) => (creado = e));
      flushMicrotasks();

      expect(service.crear).toHaveBeenCalledOnceWith(NUEVO);
      expect(creado?.id).toBe(11);
      expect(facade.empleados().map((e) => e.id)).toEqual([1, 11]);
      expect(service.getAll).not.toHaveBeenCalled(); // no se ha vuelto a pedir la lista
      expect(TestBed.inject(NotificacionService).lista().map((n) => n.mensaje)).toEqual(['Empleado 11 incorporado correctamente']);
    }));

    it('actualiza los derivados al instante (disponibles, totales por rol)', fakeAsync(() => {
      state.setEmpleados([empleado(1)]);
      service.crear.and.returnValue(of(empleado(11, 'qa', true)));
      facade.darDeAlta(NUEVO);
      flushMicrotasks();
      expect(facade.disponibles().length).toBe(2);
      expect(facade.totalPorRol().qa).toBe(1);
    }));

    it('si el alta falla, la promesa se rechaza y la lista no cambia ni se avisa de éxito', fakeAsync(() => {
      state.setEmpleados([empleado(1)]);
      service.crear.and.returnValue(throwError(() => new Error('500')));
      let error: unknown;
      facade.darDeAlta(NUEVO).catch((e) => (error = e));
      flushMicrotasks();
      expect(error).toBeInstanceOf(Error);
      expect(facade.empleados().length).toBe(1);
      expect(TestBed.inject(NotificacionService).lista()).toEqual([]);
    }));
  });

  describe('eliminar', () => {
    it('elimina en el servicio y lo quita de la lista SIN recargarla', fakeAsync(() => {
      state.setEmpleados([empleado(1), empleado(2)]);
      service.eliminar.and.returnValue(of(undefined));
      let resultado: boolean | undefined;
      facade.eliminar(1).then((r) => (resultado = r));
      flushMicrotasks();
      expect(service.eliminar).toHaveBeenCalledOnceWith(1);
      expect(resultado).toBeTrue();
      expect(facade.empleados().map((e) => e.id)).toEqual([2]);
      expect(service.getAll).not.toHaveBeenCalled();
    }));

    it('si falla devuelve false y la lista no cambia (el aviso lo da el interceptor)', fakeAsync(() => {
      state.setEmpleados([empleado(1), empleado(2)]);
      service.eliminar.and.returnValue(throwError(() => new Error('500')));
      let resultado: boolean | undefined;
      facade.eliminar(1).then((r) => (resultado = r));
      flushMicrotasks();
      expect(resultado).toBeFalse();
      expect(facade.empleados().length).toBe(2);
    }));
  });
});
