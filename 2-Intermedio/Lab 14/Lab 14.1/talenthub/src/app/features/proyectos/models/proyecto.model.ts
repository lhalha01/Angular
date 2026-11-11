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

/** Vista reducida para listados. */
export type ProyectoResumen = Pick<Proyecto, 'id' | 'nombre' | 'cliente' | 'estado'>;
