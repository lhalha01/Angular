import { Empleado, RolEmpleado } from '../models/empleado.model';
import { combinar, filtrarPorDisponibilidad, filtrarPorRol } from './filtros-empleados';

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

const TODOS = [empleado(1, 'qa', true), empleado(2, 'qa', false), empleado(3, 'devops', true), empleado(4, 'manager', false)];
const ids = (lista: Empleado[]) => lista.map((e) => e.id);

describe('estrategias de filtrado de empleados', () => {
  describe('filtrarPorRol', () => {
    it('deja solo los del rol indicado', () => {
      expect(ids(filtrarPorRol('qa')(TODOS))).toEqual([1, 2]);
      expect(ids(filtrarPorRol('manager')(TODOS))).toEqual([4]);
    });

    it('un rol sin empleados da una lista vacía', () => {
      expect(filtrarPorRol('diseñador')(TODOS)).toEqual([]);
    });

    it('«todos» no filtra (y devuelve una copia)', () => {
      const resultado = filtrarPorRol('todos')(TODOS);
      expect(ids(resultado)).toEqual([1, 2, 3, 4]);
      expect(resultado).not.toBe(TODOS);
    });
  });

  describe('filtrarPorDisponibilidad', () => {
    it('disponibles y ocupados', () => {
      expect(ids(filtrarPorDisponibilidad('disponibles')(TODOS))).toEqual([1, 3]);
      expect(ids(filtrarPorDisponibilidad('ocupados')(TODOS))).toEqual([2, 4]);
    });

    it('«todos» no filtra', () => {
      expect(ids(filtrarPorDisponibilidad('todos')(TODOS))).toEqual([1, 2, 3, 4]);
    });
  });

  describe('combinar', () => {
    it('aplica todas las estrategias a la vez', () => {
      const filtro = combinar(filtrarPorRol('qa'), filtrarPorDisponibilidad('disponibles'));
      expect(ids(filtro(TODOS))).toEqual([1]);
    });

    it('el orden de las estrategias no cambia el resultado', () => {
      const a = combinar(filtrarPorRol('qa'), filtrarPorDisponibilidad('ocupados'));
      const b = combinar(filtrarPorDisponibilidad('ocupados'), filtrarPorRol('qa'));
      expect(ids(a(TODOS))).toEqual(ids(b(TODOS)));
    });

    it('sin estrategias devuelve la lista tal cual, y no modifica la original', () => {
      expect(ids(combinar()(TODOS))).toEqual([1, 2, 3, 4]);
      combinar(filtrarPorRol('devops'))(TODOS);
      expect(TODOS.length).toBe(4);
    });
  });
});
