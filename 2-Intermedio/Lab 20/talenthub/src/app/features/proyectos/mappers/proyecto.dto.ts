// DTO: forma de los datos que devuelve la API para un proyecto (`/projects` del backend local). Solo debe importarlo
// `proyecto.mapper.ts`; el resto de la aplicación usa el modelo `Proyecto` (lo hace cumplir la regla
// `no-restricted-imports` de eslint.config.js).

export interface ProyectoDto {
  id: number;
  name: string;
  client: string;
  /** «active», «paused» o «completed». */
  status: string;
  /** Día de inicio, `AAAA-MM-DD`. */
  startDate: string;
  /** Día de fin, `AAAA-MM-DD`, o `null` mientras no ha terminado. */
  endDate: string | null;
  /** Los ids de los empleados asignados al proyecto (su equipo). */
  memberIds: number[];
}

/** Lo mínimo que se lee de un usuario de la API (`/users`) para mostrar el equipo de un proyecto. */
export interface MiembroDto {
  id: number;
  name: string;
}
