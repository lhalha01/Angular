// Mapper: convierte el DTO de la API en el modelo de dominio.
// Aísla al resto de la aplicación del formato de la API: si cambia, solo cambia este archivo.

import { Empleado, Habilidad, NuevoEmpleado, ROLES_EMPLEADO, RolEmpleado } from '../models/empleado.model';
import { EmpleadoDto, HabilidadDto, NuevoEmpleadoDto } from './empleado.dto';

const NIVELES: readonly Habilidad['nivel'][] = ['junior', 'mid', 'senior'];

const esRol = (valor: unknown): valor is RolEmpleado => ROLES_EMPLEADO.some((rol) => rol === valor);
const esNivel = (valor: unknown): valor is Habilidad['nivel'] => NIVELES.some((nivel) => nivel === valor);

/** Un día `AAAA-MM-DD` como fecha local (con `new Date('2026-01-05')` saldría el día anterior en zonas al oeste de UTC). */
function leerDia(valor: unknown): Date | null {
  if (typeof valor !== 'string') return null;
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  return partes ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])) : null;
}

/** Las habilidades válidas de la API (nombre y nivel conocidos); descarta las que no tienen la forma esperada. */
function leerHabilidades(valor: unknown): Habilidad[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((h): h is HabilidadDto => typeof h === 'object' && h !== null && typeof (h as HabilidadDto).name === 'string' && esNivel((h as HabilidadDto).level))
    .map((h): Habilidad => ({ nombre: h.name, nivel: h.level as Habilidad['nivel'] }));
}

/**
 * Patrón **Adapter**: adapta el DTO de la API (`/users`: `name`, `role`, `skills`, `available`, `projectId`, `hiredAt`…) al
 * modelo de dominio `Empleado` (`nombre`, `rol`, `habilidades`, `disponible`, `proyectoActualId`, `fechaIncorporacion`).
 * Tolera un servidor que aún no trae los datos de empleado (rol «desarrollador», disponible y sin proyecto).
 */
export function mapearEmpleado(dto: EmpleadoDto): Empleado {
  return {
    id: dto.id,
    nombre: dto.name,
    email: dto.email,
    rol: esRol(dto.role) ? dto.role : 'desarrollador',
    habilidades: leerHabilidades(dto.skills),
    disponible: typeof dto.available === 'boolean' ? dto.available : true,
    proyectoActualId: typeof dto.projectId === 'number' ? dto.projectId : null,
    fechaIncorporacion: leerDia(dto.hiredAt) ?? new Date(),
  };
}

/** Type guard de la forma mínima que el mapper necesita de un elemento de la API (frontera de datos). */
function esEmpleadoDto(valor: unknown): valor is EmpleadoDto {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return typeof v['id'] === 'number' && typeof v['name'] === 'string' && typeof v['email'] === 'string';
}

/** Convierte un elemento JSON de la API en `Empleado`, o `null` si no tiene la forma esperada. */
export function leerEmpleado(json: unknown): Empleado | null {
  return esEmpleadoDto(json) ? mapearEmpleado(json) : null;
}

/** Convierte la respuesta JSON de la lista de la API; descarta los elementos inválidos. Si no es una lista, devuelve []. */
export function leerEmpleados(json: unknown): Empleado[] {
  return Array.isArray(json) ? json.map(leerEmpleado).filter((e): e is Empleado => e !== null) : [];
}

/** Traduce los datos del alta al cuerpo que espera la API (nombre, email y datos de empleado). */
export function aNuevoEmpleadoDto(datos: NuevoEmpleado): NuevoEmpleadoDto {
  return {
    name: datos.nombre,
    email: datos.email,
    role: datos.rol,
    skills: datos.habilidades.map((h): HabilidadDto => ({ name: h.nombre, level: h.nivel })),
    available: datos.disponible,
    projectId: datos.proyectoActualId,
  };
}
