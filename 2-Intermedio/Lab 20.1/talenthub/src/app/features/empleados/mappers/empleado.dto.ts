// DTO: forma exacta de los datos que devuelve la API (`/users` del backend local: los campos de JSONPlaceholder más los
// datos de empleado). Solo debe importarlo `empleado.mapper.ts`; el resto de la aplicación usa el modelo `Empleado`
// (lo hace cumplir la regla `no-restricted-imports` de eslint.config.js).

export interface HabilidadDto {
  name: string;
  level: string;
}

export interface EmpleadoDto {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  company?: { name?: string | null } | null;
  /** «desarrollador», «diseñador», «qa», «devops» o «manager». */
  role?: string;
  skills?: HabilidadDto[];
  available?: boolean;
  /** El proyecto (`/projects`) al que está asignado, o `null`. */
  projectId?: number | null;
  /** Día de incorporación, `AAAA-MM-DD`. */
  hiredAt?: string | null;
}

/** Cuerpo del alta (POST /users): nombre y email, más los datos de empleado. La fecha de incorporación la pone el servidor. */
export interface NuevoEmpleadoDto {
  name: string;
  email: string;
  role: string;
  skills: HabilidadDto[];
  available: boolean;
  projectId: number | null;
}
