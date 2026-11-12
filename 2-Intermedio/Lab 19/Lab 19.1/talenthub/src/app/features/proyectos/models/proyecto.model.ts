// Modelo de dominio de Proyecto (TalentHub).
// Tipos que se introducen: EstadoProyecto, Proyecto y ProyectoResumen.

export type EstadoProyecto = 'activo' | 'pausado' | 'completado';

export interface Proyecto {
  id: number;
  nombre: string;
  cliente: string;
  estado: EstadoProyecto;
  fechaInicio: Date;
  /** `null` mientras el proyecto no ha terminado. */
  fechaFin: Date | null;
  /** Ids de los empleados asignados (la relación con `Empleado` es por id, no por referencia). */
  empleadosIds: number[];
}

/** Una persona del equipo de un proyecto: lo mínimo para mostrarla y enlazar a su perfil. */
export interface MiembroEquipo {
  id: number;
  nombre: string;
}

/** Los estados posibles, en el orden en que se ofrecen en el filtro. */
export const ESTADOS_PROYECTO: readonly EstadoProyecto[] = ['activo', 'pausado', 'completado'];

/** Vista reducida para listados. */
export type ProyectoResumen = Pick<Proyecto, 'id' | 'nombre' | 'cliente' | 'estado'>;
