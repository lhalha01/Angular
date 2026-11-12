// Mapper: convierte el DTO de la API en el modelo de dominio.
// Aísla al resto de la aplicación del formato de la API: si cambia, solo cambia este archivo.

import { Empleado, NuevoEmpleado, RolEmpleado } from '../models/empleado.model';
import { EmpleadoDto, NuevoEmpleadoDto } from './empleado.dto';

export function mapearEmpleado(dto: EmpleadoDto): Empleado {
  return {
    id: dto.id,
    nombre: dto.name,
    email: dto.email,
    rol: 'desarrollador' as RolEmpleado, // valor por defecto hasta tener la API real
    habilidades: [],
    disponible: dto.id % 2 === 0, // simulado
    proyectoActualId: null,
    fechaIncorporacion: new Date(),
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

/** Traduce los datos del alta al cuerpo que espera la API (solo `name` y `email`). */
export function aNuevoEmpleadoDto(datos: NuevoEmpleado): NuevoEmpleadoDto {
  return { name: datos.nombre, email: datos.email };
}
