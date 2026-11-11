// Modelo de dominio de Empleado (TalentHub).
// Tipos que se introducen: RolEmpleado, Habilidad, Empleado y sus variantes derivadas
// (NuevoEmpleado, ActualizarEmpleado, EmpleadoResumen), más el type guard `esEmpleado`.

export type RolEmpleado = 'desarrollador' | 'diseñador' | 'qa' | 'devops' | 'manager';

/** Todos los roles, en el orden en que se ofrecen en los filtros y formularios. */
export const ROLES_EMPLEADO: readonly RolEmpleado[] = ['desarrollador', 'diseñador', 'qa', 'devops', 'manager'];

export interface Habilidad {
  nombre: string;
  nivel: 'junior' | 'mid' | 'senior';
}

export interface Empleado {
  id: number;
  nombre: string;
  email: string;
  rol: RolEmpleado;
  habilidades: Habilidad[];
  disponible: boolean;
  proyectoActualId: number | null;
  fechaIncorporacion: Date;
}

// Variantes derivadas con Utility Types: se mantienen sincronizadas con `Empleado`
// sin repetir campos.
/** Datos para dar de alta un empleado: el id y la fecha de incorporación los asigna el sistema. */
export type NuevoEmpleado = Omit<Empleado, 'id' | 'fechaIncorporacion'>;
/** Cambios permitidos sobre un empleado existente: solo estos cuatro campos y todos opcionales. */
export type ActualizarEmpleado = Partial<
  Pick<Empleado, 'rol' | 'disponible' | 'proyectoActualId' | 'habilidades'>
>;
/** Vista reducida para listados. */
export type EmpleadoResumen = Pick<Empleado, 'id' | 'nombre' | 'email' | 'rol' | 'disponible'>;

/**
 * Type guard: indica si un valor de origen desconocido (por ejemplo, una respuesta JSON)
 * tiene la forma de un `Empleado`.
 *
 * Es una comprobación superficial: verifica que sea un objeto con las propiedades
 * `nombre`, `email` y `rol`, pero no valida sus tipos ni el resto de campos.
 */
export function esEmpleado(valor: unknown): valor is Empleado {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'nombre' in valor &&
    'email' in valor &&
    'rol' in valor
  );
}
