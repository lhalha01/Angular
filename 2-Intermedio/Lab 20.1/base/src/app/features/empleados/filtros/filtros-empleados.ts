import { Empleado, RolEmpleado } from '../models/empleado.model';

/**
 * Patrón **Strategy**: cada filtro es una función intercambiable con la misma firma (`EstrategiaFiltro`), que recibe la lista y
 * devuelve la que cumple su criterio. El directorio las elige según los controles y las encadena con `combinar`; añadir un
 * criterio nuevo (p. ej. por habilidad) es escribir otra estrategia, sin tocar las demás ni el componente.
 */
export type EstrategiaFiltro = (empleados: readonly Empleado[]) => Empleado[];

export type FiltroRol = RolEmpleado | 'todos';
export type FiltroDisponibilidad = 'todos' | 'disponibles' | 'ocupados';

/** Solo los del rol indicado (`'todos'` no filtra). */
export const filtrarPorRol =
  (rol: FiltroRol): EstrategiaFiltro =>
  (empleados) =>
    rol === 'todos' ? [...empleados] : empleados.filter((e) => e.rol === rol);

/** Solo los disponibles o solo los ocupados (`'todos'` no filtra). */
export const filtrarPorDisponibilidad =
  (filtro: FiltroDisponibilidad): EstrategiaFiltro =>
  (empleados) => {
    if (filtro === 'disponibles') return empleados.filter((e) => e.disponible);
    if (filtro === 'ocupados') return empleados.filter((e) => !e.disponible);
    return [...empleados];
  };

/** Encadena varias estrategias: el resultado cumple todas a la vez (los filtros se combinan entre sí). */
export const combinar =
  (...estrategias: EstrategiaFiltro[]): EstrategiaFiltro =>
  (empleados) =>
    estrategias.reduce<Empleado[]>((lista, estrategia) => estrategia(lista), [...empleados]);
