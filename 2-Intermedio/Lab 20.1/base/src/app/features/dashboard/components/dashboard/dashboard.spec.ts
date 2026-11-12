import { computed, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Empleado, EmpleadosFacade, RolEmpleado } from '@features/empleados';
import { Proyecto, ProyectoService } from '@features/proyectos';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Dashboard } from './dashboard';

const empleado = (id: number, rol: RolEmpleado, disponible: boolean): Empleado => ({
  id,
  nombre: `Empleado ${id}`,
  email: `e${id}@example.com`,
  rol,
  habilidades: [],
  disponible,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
});
const proyecto = (id: number, estado: Proyecto['estado']): Proyecto => ({
  id,
  nombre: `Proyecto ${id}`,
  cliente: 'Cliente',
  estado,
  fechaInicio: new Date(2026, 0, 1),
  fechaFin: null,
  empleadosIds: [],
});

/** El dashboard con la fachada y el servicio de proyectos simulados (las señales las controla el test). */
describe('Dashboard', () => {
  let empleados: WritableSignal<Empleado[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let cargar: jasmine.Spy;
  let fixture: ComponentFixture<Dashboard>;
  let el: HTMLElement;

  function montar(proyectos$: Observable<Proyecto[]> = of([proyecto(1, 'activo'), proyecto(2, 'pausado'), proyecto(3, 'activo')])) {
    empleados = signal([empleado(1, 'desarrollador', true), empleado(2, 'qa', false), empleado(3, 'qa', true)]);
    cargando = signal(false);
    error = signal<string | null>(null);
    cargar = jasmine.createSpy('cargar');
    const facade = {
      empleados: empleados.asReadonly(),
      cargando: cargando.asReadonly(),
      error: error.asReadonly(),
      disponibles: computed(() => empleados().filter((e) => e.disponible)),
      totalPorRol: computed(() => ({
        desarrollador: empleados().filter((e) => e.rol === 'desarrollador').length,
        diseñador: 0,
        qa: empleados().filter((e) => e.rol === 'qa').length,
        devops: 0,
        manager: 0,
      })),
      cargar,
    };
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: EmpleadosFacade, useValue: facade },
        { provide: ProyectoService, useValue: { getAll: () => proyectos$ } },
      ],
    });
    fixture = TestBed.createComponent(Dashboard);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  const cifra = (titulo: string) =>
    Array.from(el.querySelectorAll('app-stat-card'))
      .find((c) => c.querySelector('.stat__titulo')?.textContent === titulo)
      ?.querySelector('.stat__valor')?.textContent;

  it('muestra el título y pide cargar los empleados', () => {
    montar();
    expect(el.querySelector('h1')?.textContent).toBe('Dashboard');
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  describe('cifras', () => {
    it('empleados, disponibles y proyectos activos', () => {
      montar();
      expect(cifra('Empleados')).toBe('3');
      expect(cifra('Disponibles')).toBe('2');
      expect(cifra('Proyectos activos')).toBe('2');
    });

    it('se actualizan cuando cambia el estado de los empleados (un alta)', () => {
      montar();
      empleados.update((l) => [...l, empleado(4, 'devops', true)]);
      fixture.detectChanges();
      expect(cifra('Empleados')).toBe('4');
      expect(cifra('Disponibles')).toBe('3');
    });

    it('mientras cargan los empleados (sin lista) y los proyectos no hay cifra', () => {
      const proyectos = new Subject<Proyecto[]>();
      montar(proyectos);
      empleados.set([]);
      cargando.set(true);
      fixture.detectChanges();
      expect(cifra('Empleados')).toBe('—');
      expect(cifra('Disponibles')).toBe('—');
      expect(cifra('Proyectos activos')).toBe('—');
      proyectos.next([proyecto(1, 'activo')]);
      fixture.detectChanges();
      expect(cifra('Proyectos activos')).toBe('1');
    });

    it('en una recarga se conserva la lista que había', () => {
      montar();
      cargando.set(true);
      fixture.detectChanges();
      expect(cifra('Empleados')).toBe('3');
    });

    it('si falla la carga de empleados o la de proyectos, la cifra queda en «—»', () => {
      montar(throwError(() => new Error('500')));
      expect(cifra('Proyectos activos')).toBe('—');
      error.set('No se pudieron cargar los empleados.');
      fixture.detectChanges();
      expect(cifra('Empleados')).toBe('—');
    });
  });

  describe('desglose por rol', () => {
    it('se muestra directamente, con los totales por rol del estado', () => {
      montar();
      const filas = Array.from(el.querySelectorAll('app-desglose-por-rol li')).map((li) => li.textContent?.trim());
      expect(filas).toContain('desarrollador1');
      expect(filas).toContain('qa2');
    });
  });
});
