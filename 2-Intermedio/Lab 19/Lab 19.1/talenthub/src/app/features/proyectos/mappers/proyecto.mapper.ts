// Mapper: convierte el DTO de la API (un proyecto de `/projects`) en el modelo de dominio `Proyecto`.
// Aísla al resto de la aplicación del formato de la API: si cambia, solo cambia este archivo.

import { EstadoProyecto, MiembroEquipo, Proyecto } from '../models/proyecto.model';
import { MiembroDto, ProyectoDto } from './proyecto.dto';

/** Los estados de la API (en inglés) y su equivalente en el dominio. */
const ESTADOS: Readonly<Record<string, EstadoProyecto>> = { active: 'activo', paused: 'pausado', completed: 'completado' };

/** Un día `AAAA-MM-DD` como fecha local (con `new Date('2026-01-05')` saldría el día anterior en zonas al oeste de UTC). */
function leerDia(valor: string): Date {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  return partes ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])) : new Date(NaN);
}

/**
 * Patrón **Adapter**: adapta un proyecto de la API (`name`, `client`, `status`, `startDate`, `endDate`, `memberIds`) al modelo
 * de dominio `Proyecto` (`nombre`, `cliente`, `estado`, `fechaInicio`, `fechaFin`, `empleadosIds`).
 */
export function mapearProyecto(dto: ProyectoDto): Proyecto {
  return {
    id: dto.id,
    nombre: dto.name,
    cliente: dto.client,
    estado: ESTADOS[dto.status],
    fechaInicio: leerDia(dto.startDate),
    fechaFin: dto.endDate === null ? null : leerDia(dto.endDate),
    empleadosIds: [...dto.memberIds],
  };
}

/** Type guard de la forma que el mapper necesita de un elemento de la API (frontera de datos). */
function esProyectoDto(valor: unknown): valor is ProyectoDto {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    typeof v['id'] === 'number' &&
    typeof v['name'] === 'string' &&
    typeof v['client'] === 'string' &&
    typeof v['status'] === 'string' &&
    v['status'] in ESTADOS &&
    typeof v['startDate'] === 'string' &&
    (v['endDate'] === null || typeof v['endDate'] === 'string') &&
    Array.isArray(v['memberIds']) &&
    v['memberIds'].every((id) => typeof id === 'number')
  );
}

/** Convierte un elemento JSON de la API en `Proyecto`, o `null` si no tiene la forma esperada. */
export function leerProyecto(json: unknown): Proyecto | null {
  return esProyectoDto(json) ? mapearProyecto(json) : null;
}

/** Convierte la respuesta JSON de la lista; descarta los inválidos. Si no es una lista, devuelve []. */
export function leerProyectos(json: unknown): Proyecto[] {
  return Array.isArray(json) ? json.map(leerProyecto).filter((p): p is Proyecto => p !== null) : [];
}

/** El equipo: los usuarios que devuelve la API (`/users?projectId=`); descarta los elementos inválidos. */
export function leerEquipo(json: unknown): MiembroEquipo[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((u): u is MiembroDto => typeof u === 'object' && u !== null && typeof (u as MiembroDto).id === 'number' && typeof (u as MiembroDto).name === 'string')
    .map((u): MiembroEquipo => ({ id: u.id, nombre: u.name }));
}
