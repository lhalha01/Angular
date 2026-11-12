import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, defer, of, throwError } from 'rxjs';
import { Empleado, RolEmpleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';
import { EmpleadosFacade } from '../../services/empleados.facade';
import { DirectorioEmpleados } from './directorio.component';

const empleado = (id: number, nombre: string, rol: RolEmpleado = 'desarrollador', disponible = true): Empleado => ({
  id,
  nombre,
  email: `${nombre.toLowerCase().replace(/\s/g, '.')}@example.com`,
  rol,
  habilidades: [],
  disponible,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
});

const TODOS = [
  empleado(1, 'Ana Pérez', 'desarrollador', true),
  empleado(2, 'Luis Gómez', 'qa', false),
  empleado(3, 'Marta Ruiz', 'qa', true),
  empleado(4, 'Ervin Howell', 'devops', false),
];

/** El directorio con la fachada y el estado reales; solo se simula el servicio HTTP. */
describe('DirectorioEmpleados', () => {
  let getAll: jasmine.Spy<(termino?: string) => Observable<Empleado[]>>;
  let fixture: ComponentFixture<DirectorioEmpleados>;
  let el: HTMLElement;

  function crear(respuesta: (termino?: string) => Observable<Empleado[]> = () => of(TODOS)) {
    getAll = jasmine.createSpy('getAll').and.callFake(respuesta);
    TestBed.configureTestingModule({
      imports: [DirectorioEmpleados],
      providers: [provideRouter([]), { provide: EmpleadoService, useValue: { getAll } }],
    });
    fixture = TestBed.createComponent(DirectorioEmpleados);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  /** Avanza el reloj y deja que se ejecuten los efectos del componente (que corren con la detección de cambios). */
  const avanzar = (ms: number) => {
    tick(ms);
    fixture.detectChanges();
  };
  /** Escribe en el buscador una tecla a la vez, esperando `ms` entre ellas. */
  function teclear(texto: string, ms: number) {
    const input = el.querySelector<HTMLInputElement>('input[name=busqueda]')!;
    let escrito = '';
    for (const letra of texto) {
      escrito += letra;
      input.value = escrito;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      avanzar(ms);
    }
  }
  const poner = (valor: string) => {
    const input = el.querySelector<HTMLInputElement>('input[name=busqueda]')!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const elegir = (name: string, valor: string) => {
    const select = el.querySelector<HTMLSelectElement>(`select[name=${name}]`)!;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const nombres = () => Array.from(el.querySelectorAll('.lista a')).map((a) => a.textContent?.trim());

  describe('carga inicial', () => {
    it('pide la lista completa al empezar, sin esperar la pausa de la búsqueda', fakeAsync(() => {
      crear();
      expect(getAll).toHaveBeenCalledOnceWith('');
    }));

    it('muestra «cargando» hasta que llegan los datos y luego la lista con enlaces al perfil', fakeAsync(() => {
      const datos = new Subject<Empleado[]>();
      crear(() => datos);
      expect(el.textContent).toContain('Cargando');
      datos.next(TODOS);
      datos.complete();
      fixture.detectChanges();
      expect(el.textContent).not.toContain('Cargando');
      expect(nombres()).toEqual(['Ana Pérez', 'Luis Gómez', 'Marta Ruiz', 'Ervin Howell']);
      expect(Array.from(el.querySelectorAll<HTMLAnchorElement>('.lista a')).map((a) => a.getAttribute('href'))).toEqual([
        '/empleados/1',
        '/empleados/2',
        '/empleados/3',
        '/empleados/4',
      ]);
    }));

    it('muestra el resumen con el total y los disponibles (que salen del estado de la fachada)', fakeAsync(() => {
      crear();
      expect(el.querySelector('.resumen')?.textContent?.replace(/\s+/g, ' ')).toContain('4 de 4 empleados · 2 disponibles');
    }));

    it('si falla muestra un error que menciona el backend (el aviso lo da el interceptor)', fakeAsync(() => {
      crear(() => throwError(() => new Error('sin conexión')));
      expect(el.querySelector('[role=alert]')?.textContent).toContain('backend');
      expect(el.textContent).not.toContain('Cargando');
    }));

    it('si no hay empleados lo indica', fakeAsync(() => {
      crear(() => of([]));
      expect(el.textContent).toContain('No se encontraron empleados');
    }));

    it('enlaza al formulario de alta', fakeAsync(() => {
      crear();
      expect(el.querySelector<HTMLAnchorElement>('a.boton')?.getAttribute('href')).toBe('/empleados/nuevo');
    }));
  });

  describe('lee el estado de la fachada', () => {
    it('lo que se añade al estado (un alta) aparece en la lista sin recargar', fakeAsync(() => {
      crear();
      expect(getAll).toHaveBeenCalledTimes(1);
      const facade = TestBed.inject(EmpleadosFacade) as unknown as { state: { agregar(e: Empleado): void } };
      facade.state.agregar(empleado(5, 'Nuria Vidal'));
      fixture.detectChanges();
      expect(nombres()).toContain('Nuria Vidal');
      expect(el.querySelector('.resumen')?.textContent?.replace(/\s+/g, ' ')).toContain('5 de 5 empleados');
      expect(getAll).toHaveBeenCalledTimes(1); // no se ha vuelto a pedir la lista
    }));
  });

  describe('búsqueda (debounce + distinctUntilChanged + switchMap)', () => {
    it('teclear deprisa no lanza una petición por tecla: solo una, 300 ms después de la última', fakeAsync(() => {
      crear();
      getAll.calls.reset();
      teclear('ervin', 100); // 5 teclas, 100 ms entre ellas: nunca pasan 300 ms sin teclear
      expect(getAll).not.toHaveBeenCalled();
      avanzar(200); // hasta completar 300 ms desde la última tecla
      expect(getAll).toHaveBeenCalledTimes(1);
      expect(getAll).toHaveBeenCalledWith('ervin');
    }));

    it('con menos de 2 caracteres no busca (equivale a pedir todo)', fakeAsync(() => {
      crear();
      getAll.calls.reset();
      teclear('e', 400);
      expect(getAll).not.toHaveBeenCalled(); // «e» → '' → igual que lo ya cargado
    }));

    it('no repite la misma búsqueda (distinctUntilChanged)', fakeAsync(() => {
      crear();
      teclear('an', 400);
      expect(getAll).toHaveBeenCalledTimes(2); // '' y 'an'
      poner('an '); // un espacio al final: tras recortar es el mismo término
      avanzar(400);
      expect(getAll).toHaveBeenCalledTimes(2);
    }));

    it('si llega otra búsqueda con una en vuelo, cancela la anterior (switchMap en la fachada)', fakeAsync(() => {
      const respuestas: Subject<Empleado[]>[] = [];
      const canceladas: boolean[] = [];
      crear((termino) => {
        if (!termino) return of(TODOS);
        const indice = respuestas.length;
        const s = new Subject<Empleado[]>();
        respuestas.push(s);
        return defer(
          () =>
            new Observable<Empleado[]>((obs) => {
              const sub = s.subscribe(obs);
              return () => {
                canceladas[indice] = !s.isStopped;
                sub.unsubscribe();
              };
            }),
        );
      });

      teclear('an', 50);
      avanzar(300); // sale «an» y queda en vuelo
      teclear('anas', 50);
      avanzar(300); // sale «anas»: la de «an» se cancela

      expect(respuestas.length).toBe(2);
      expect(canceladas[0]).toBeTrue();

      respuestas[0].next([empleado(1, 'Resultado viejo')]); // llega tarde: nadie la escucha
      respuestas[1].next([empleado(3, 'Resultado nuevo')]);
      respuestas[1].complete();
      fixture.detectChanges();
      expect(nombres()).toEqual(['Resultado nuevo']);
    }));

    it('muestra «cargando» mientras llega cada búsqueda', fakeAsync(() => {
      const pendiente = new Subject<Empleado[]>();
      crear((t) => (t ? pendiente : of(TODOS)));
      teclear('ana', 50);
      avanzar(300);
      expect(el.textContent).toContain('Cargando');
      pendiente.next([TODOS[0]]);
      pendiente.complete();
      fixture.detectChanges();
      expect(nombres()).toEqual(['Ana Pérez']);
    }));
  });

  describe('filtros combinados', () => {
    it('por rol', fakeAsync(() => {
      crear();
      elegir('rol', 'qa');
      expect(nombres()).toEqual(['Luis Gómez', 'Marta Ruiz']);
    }));

    it('por disponibilidad', fakeAsync(() => {
      crear();
      elegir('disponibilidad', 'disponibles');
      expect(nombres()).toEqual(['Ana Pérez', 'Marta Ruiz']);
      elegir('disponibilidad', 'ocupados');
      expect(nombres()).toEqual(['Luis Gómez', 'Ervin Howell']);
    }));

    it('rol y disponibilidad a la vez', fakeAsync(() => {
      crear();
      elegir('rol', 'qa');
      elegir('disponibilidad', 'disponibles');
      expect(nombres()).toEqual(['Marta Ruiz']);
    }));

    it('los filtros se combinan con la búsqueda y cambiarlos no vuelve a pedir datos', fakeAsync(() => {
      crear((t) => of(t ? [TODOS[1], TODOS[2]] : TODOS));
      teclear('qa', 400);
      expect(getAll).toHaveBeenCalledTimes(2);
      elegir('rol', 'qa');
      elegir('disponibilidad', 'disponibles');
      expect(nombres()).toEqual(['Marta Ruiz']);
      expect(getAll).toHaveBeenCalledTimes(2); // filtrar en el cliente no hace peticiones
    }));

    it('el resumen refleja el filtrado: «N de M» y los disponibles de lo cargado', fakeAsync(() => {
      crear();
      elegir('rol', 'qa');
      expect(el.querySelector('.resumen')?.textContent?.replace(/\s+/g, ' ')).toContain('2 de 4 empleados · 2 disponibles');
    }));

    it('si ningún empleado cumple los filtros lo indica', fakeAsync(() => {
      crear();
      elegir('rol', 'manager');
      expect(el.textContent).toContain('No se encontraron empleados con los filtros actuales');
    }));

    it('ofrece todos los roles', fakeAsync(() => {
      crear();
      const opciones = Array.from(el.querySelectorAll<HTMLOptionElement>('select[name=rol] option')).map((o) => o.value);
      expect(opciones).toEqual(['todos', 'desarrollador', 'diseñador', 'qa', 'devops', 'manager']);
    }));
  });
});
