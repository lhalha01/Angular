import { TestBed } from '@angular/core/testing';
import { Empleado, RolEmpleado } from '../models/empleado.model';
import { EmpleadoStateService } from './empleado-state.service';

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

describe('EmpleadoStateService', () => {
  let state: EmpleadoStateService;
  beforeEach(() => (state = TestBed.inject(EmpleadoStateService)));

  it('empieza vacío, sin cargar y sin error', () => {
    expect(state.empleados()).toEqual([]);
    expect(state.cargando()).toBeFalse();
    expect(state.error()).toBeNull();
    expect(state.disponibles()).toEqual([]);
    expect(state.ocupados()).toEqual([]);
  });

  it('setEmpleados, setCargando y setError cambian el estado', () => {
    state.setEmpleados([empleado(1)]);
    state.setCargando(true);
    state.setError('fallo');
    expect(state.empleados().length).toBe(1);
    expect(state.cargando()).toBeTrue();
    expect(state.error()).toBe('fallo');
    state.setError(null);
    expect(state.error()).toBeNull();
  });

  describe('estado derivado (computed)', () => {
    beforeEach(() =>
      state.setEmpleados([
        empleado(1, 'desarrollador', true),
        empleado(2, 'qa', false),
        empleado(3, 'qa', true),
        empleado(4, 'devops', false),
      ]),
    );

    it('disponibles y ocupados', () => {
      expect(state.disponibles().map((e) => e.id)).toEqual([1, 3]);
      expect(state.ocupados().map((e) => e.id)).toEqual([2, 4]);
    });

    it('totalPorRol cuenta cada rol y deja a 0 los que no tienen empleados', () => {
      expect(state.totalPorRol()).toEqual({ desarrollador: 1, diseñador: 0, qa: 2, devops: 1, manager: 0 });
    });

    it('se recalculan solos al cambiar la lista', () => {
      state.agregar(empleado(5, 'manager', true));
      expect(state.disponibles().length).toBe(3);
      expect(state.totalPorRol().manager).toBe(1);
      state.eliminar(2);
      expect(state.ocupados().map((e) => e.id)).toEqual([4]);
      expect(state.totalPorRol().qa).toBe(1);
    });
  });

  describe('modificar la lista', () => {
    it('agregar añade al final sin tocar el resto (y no muta el array anterior)', () => {
      state.setEmpleados([empleado(1)]);
      const antes = state.empleados();
      state.agregar(empleado(2));
      expect(state.empleados().map((e) => e.id)).toEqual([1, 2]);
      expect(antes.length).toBe(1); // inmutabilidad: es otro array
    });

    it('eliminar quita por id y es inofensivo si no existe', () => {
      state.setEmpleados([empleado(1), empleado(2)]);
      state.eliminar(1);
      expect(state.empleados().map((e) => e.id)).toEqual([2]);
      state.eliminar(99);
      expect(state.empleados().length).toBe(1);
    });

    it('actualizar sustituye el empleado con ese id y conserva el orden', () => {
      state.setEmpleados([empleado(1), empleado(2), empleado(3)]);
      state.actualizar({ ...empleado(2), nombre: 'Cambiado', disponible: false });
      expect(state.empleados().map((e) => e.nombre)).toEqual(['Empleado 1', 'Cambiado', 'Empleado 3']);
      expect(state.ocupados().map((e) => e.id)).toEqual([2]);
    });

    it('actualizar un id que no existe no añade nada', () => {
      state.setEmpleados([empleado(1)]);
      state.actualizar(empleado(9));
      expect(state.empleados().length).toBe(1);
    });
  });

  it('solo expone señales de lectura (no se puede escribir desde fuera)', () => {
    expect((state.empleados as unknown as { set?: unknown }).set).toBeUndefined();
    expect((state.cargando as unknown as { set?: unknown }).set).toBeUndefined();
    expect((state.error as unknown as { set?: unknown }).set).toBeUndefined();
  });
});
