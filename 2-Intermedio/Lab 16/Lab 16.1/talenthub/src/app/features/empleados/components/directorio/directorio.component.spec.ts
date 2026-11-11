import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, defer, of, throwError } from 'rxjs';
import { Empleado, RolEmpleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';
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

describe('DirectorioEmpleados', () => {
  let getAll: jasmine.Spy<(termino?: string) => Observable<Empleado[]>>;

  function crear(respuesta: (termino?: string) => Observable<Empleado[]> = () => of(TODOS)) {
    getAll = jasmine.createSpy('getAll').and.callFake(respuesta);
    TestBed.configureTestingModule({
      imports: [DirectorioEmpleados],
      providers: [provideRouter([]), { provide: EmpleadoService, useValue: { getAll } }],
    });
    const fixture = TestBed.createComponent(DirectorioEmpleados);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  /** Escribe en el buscador una tecla a la vez, esperando `ms` entre ellas. */
  function teclear(fixture: ComponentFixture<DirectorioEmpleados>, texto: string, ms: number) {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[name=busqueda]')!;
    let escrito = '';
    for (const letra of texto) {
      escrito += letra;
      input.value = escrito;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      tick(ms);
    }
  }
  const elegir = (fixture: ComponentFixture<DirectorioEmpleados>, name: string, valor: string) => {
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(`select[name=${name}]`)!;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const nombres = (el: HTMLElement) => Array.from(el.querySelectorAll('.lista a')).map((a) => a.textContent?.trim());

  describe('carga inicial', () => {
    it('muestra «cargando», espera el debounce y pinta la lista con enlaces al perfil', fakeAsync(() => {
      const { fixture, el } = crear();
      expect(el.textContent).toContain('Cargando');
      tick(300);
      fixture.detectChanges();
      expect(nombres(el)).toEqual(['Ana Pérez', 'Luis Gómez', 'Marta Ruiz', 'Ervin Howell']);
      expect(Array.from(el.querySelectorAll<HTMLAnchorElement>('.lista a')).map((a) => a.getAttribute('href'))).toEqual([
        '/empleados/1',
        '/empleados/2',
        '/empleados/3',
        '/empleados/4',
      ]);
    }));

    it('pide todos los empleados (sin término)', fakeAsync(() => {
      crear();
      tick(300);
      expect(getAll).toHaveBeenCalledOnceWith('');
    }));

    it('muestra el resumen con el total y los disponibles', fakeAsync(() => {
      const { fixture, el } = crear();
      tick(300);
      fixture.detectChanges();
      expect(el.querySelector('.resumen')?.textContent).toContain('4 de 4 empleados · 2 disponibles');
    }));

    it('si falla muestra un error que menciona el backend (el aviso lo da el interceptor)', fakeAsync(() => {
      const { fixture, el } = crear(() => throwError(() => new Error('sin conexión')));
      tick(300);
      fixture.detectChanges();
      expect(el.querySelector('[role=alert]')?.textContent).toContain('backend');
    }));

    it('si no hay empleados lo indica', fakeAsync(() => {
      const { fixture, el } = crear(() => of([]));
      tick(300);
      fixture.detectChanges();
      expect(el.textContent).toContain('No se encontraron empleados');
    }));

    it('enlaza al formulario de alta', fakeAsync(() => {
      const { el } = crear();
      tick(300);
      expect(el.querySelector<HTMLAnchorElement>('a.boton')?.getAttribute('href')).toBe('/empleados/nuevo');
    }));
  });

  describe('búsqueda (debounce + distinctUntilChanged + switchMap)', () => {
    it('teclear deprisa no lanza una petición por tecla: solo una, 300 ms después de la última', fakeAsync(() => {
      const { fixture } = crear();
      tick(300);
      getAll.calls.reset();

      teclear(fixture, 'ervin', 100); // 5 teclas, 100 ms entre ellas: nunca pasan 300 ms sin teclear
      expect(getAll).not.toHaveBeenCalled();
      tick(200); // hasta completar 300 ms desde la última tecla
      expect(getAll).toHaveBeenCalledTimes(1);
      expect(getAll).toHaveBeenCalledWith('ervin');
    }));

    it('con menos de 2 caracteres no busca (equivale a pedir todo)', fakeAsync(() => {
      const { fixture } = crear();
      tick(300);
      getAll.calls.reset();
      teclear(fixture, 'e', 400);
      expect(getAll).not.toHaveBeenCalled(); // «e» → '' → igual que lo ya cargado (distinctUntilChanged)
    }));

    it('no repite la misma búsqueda (distinctUntilChanged)', fakeAsync(() => {
      const { fixture } = crear();
      tick(300);
      teclear(fixture, 'an', 400);
      expect(getAll).toHaveBeenCalledTimes(2); // '' y 'an'

      // Se añade un espacio al final: tras recortar es el mismo término, no se vuelve a pedir.
      const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[name=busqueda]')!;
      input.value = 'an ';
      input.dispatchEvent(new Event('input'));
      tick(400);
      expect(getAll).toHaveBeenCalledTimes(2);
    }));

    it('si llega otra búsqueda con una en vuelo, cancela la anterior (switchMap)', fakeAsync(() => {
      const respuestas: Subject<Empleado[]>[] = [];
      const cancelada: boolean[] = [];
      const { fixture, el } = crear((termino) => {
        if (!termino) return of(TODOS);
        const s = new Subject<Empleado[]>();
        respuestas.push(s);
        return defer(() => {
          const i = respuestas.length - 1;
          return new Observable<Empleado[]>((obs) => {
            const sub = s.subscribe(obs);
            return () => {
              cancelada[i] = !s.closed && !s.isStopped ? true : cancelada[i];
              sub.unsubscribe();
            };
          });
        });
      });
      tick(300);

      teclear(fixture, 'an', 50);
      tick(300); // sale la búsqueda «an» y queda en vuelo (sin respuesta)
      teclear(fixture, 'anas', 50);
      tick(300); // sale «anas»: la de «an» debe cancelarse

      expect(respuestas.length).toBe(2);
      expect(cancelada[0]).toBeTrue();

      respuestas[0].next([empleado(1, 'Resultado viejo')]); // llega tarde: nadie la escucha
      respuestas[1].next([empleado(3, 'Resultado nuevo')]);
      fixture.detectChanges();
      expect(nombres(el)).toEqual(['Resultado nuevo']);
    }));

    it('muestra «cargando» mientras llega cada búsqueda', fakeAsync(() => {
      const pendiente = new Subject<Empleado[]>();
      const { fixture, el } = crear((t) => (t ? pendiente : of(TODOS)));
      tick(300);
      teclear(fixture, 'ana', 50);
      tick(300);
      fixture.detectChanges();
      expect(el.textContent).toContain('Cargando');
      pendiente.next([TODOS[0]]);
      fixture.detectChanges();
      expect(nombres(el)).toEqual(['Ana Pérez']);
    }));
  });

  describe('filtros combinados', () => {
    it('por rol', fakeAsync(() => {
      const { fixture, el } = crear();
      tick(300);
      elegir(fixture, 'rol', 'qa');
      expect(nombres(el)).toEqual(['Luis Gómez', 'Marta Ruiz']);
    }));

    it('por disponibilidad', fakeAsync(() => {
      const { fixture, el } = crear();
      tick(300);
      elegir(fixture, 'disponibilidad', 'disponibles');
      expect(nombres(el)).toEqual(['Ana Pérez', 'Marta Ruiz']);
      elegir(fixture, 'disponibilidad', 'ocupados');
      expect(nombres(el)).toEqual(['Luis Gómez', 'Ervin Howell']);
    }));

    it('rol y disponibilidad a la vez', fakeAsync(() => {
      const { fixture, el } = crear();
      tick(300);
      elegir(fixture, 'rol', 'qa');
      elegir(fixture, 'disponibilidad', 'disponibles');
      expect(nombres(el)).toEqual(['Marta Ruiz']);
    }));

    it('los filtros se combinan con la búsqueda y cambiarlos no vuelve a pedir datos', fakeAsync(() => {
      const { fixture, el } = crear((t) => of(t ? [TODOS[1], TODOS[2]] : TODOS));
      tick(300);
      teclear(fixture, 'qa', 400);
      expect(getAll).toHaveBeenCalledTimes(2);
      elegir(fixture, 'rol', 'qa');
      elegir(fixture, 'disponibilidad', 'disponibles');
      expect(nombres(el)).toEqual(['Marta Ruiz']);
      expect(getAll).toHaveBeenCalledTimes(2); // filtrar en el cliente no hace peticiones
    }));

    it('el resumen refleja el filtrado: «N de M» y los disponibles de lo cargado', fakeAsync(() => {
      const { fixture, el } = crear();
      tick(300);
      elegir(fixture, 'rol', 'qa');
      expect(el.querySelector('.resumen')?.textContent).toContain('2 de 4 empleados · 2 disponibles');
    }));

    it('si ningún empleado cumple los filtros lo indica', fakeAsync(() => {
      const { fixture, el } = crear();
      tick(300);
      elegir(fixture, 'rol', 'manager');
      expect(el.textContent).toContain('No se encontraron empleados con los filtros actuales');
    }));

    it('ofrece todos los roles', fakeAsync(() => {
      const { el } = crear();
      tick(300);
      const opciones = Array.from(el.querySelectorAll<HTMLOptionElement>('select[name=rol] option')).map((o) => o.value);
      expect(opciones).toEqual(['todos', 'desarrollador', 'diseñador', 'qa', 'devops', 'manager']);
    }));
  });
});
