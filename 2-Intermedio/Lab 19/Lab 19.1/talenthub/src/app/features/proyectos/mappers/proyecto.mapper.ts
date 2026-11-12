// Mapper: convierte el DTO de la API (una tarea de `/todos`) en el modelo de dominio `Proyecto`.
// Aísla al resto de la aplicación del formato de la API: si cambia, solo cambia este archivo.

import { Proyecto } from '../models/proyecto.model';
import { ProyectoDto } from './proyecto.dto';

export function mapearProyecto(dto: ProyectoDto): Proyecto {
  const inicio = dto.createdAt ? new Date(dto.createdAt) : new Date();
  return {
    id: dto.id,
    nombre: dto.title,
    cliente: `Cliente ${dto.userId}`, // la API no tiene clientes: se deriva del usuario
    estado: dto.completed ? 'completado' : 'activo', // la API solo distingue completada / pendiente
    fechaInicio: inicio,
    fechaFin: dto.completed ? inicio : null, // sin fecha de cierre en la API: se toma la de inicio
    empleadosIds: [dto.userId],
  };
}

/** Type guard de la forma mínima que el mapper necesita de un elemento de la API (frontera de datos). */
function esProyectoDto(valor: unknown): valor is ProyectoDto {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    typeof v['id'] === 'number' &&
    typeof v['userId'] === 'number' &&
    typeof v['title'] === 'string' &&
    typeof v['completed'] === 'boolean'
  );
}

/** Convierte un elemento JSON de la API en `Proyecto`, o `null` si no tiene la forma esperada. */
export function leerProyecto(json: unknown): Proyecto | null {
  return esProyectoDto(json) ? mapearProyecto(json) : null;
}

/** Convierte la respuesta JSON de la lista; descarta los elementos inválidos. Si no es una lista, devuelve []. */
export function leerProyectos(json: unknown): Proyecto[] {
  return Array.isArray(json) ? json.map(leerProyecto).filter((p): p is Proyecto => p !== null) : [];
}
