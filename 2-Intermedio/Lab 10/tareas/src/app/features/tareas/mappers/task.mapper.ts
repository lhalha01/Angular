// Mapper: convierte entre el DTO de la API y el modelo de dominio `Task`, en los dos sentidos.
// Aísla al resto de la aplicación del formato de la API: si cambia, solo cambia este archivo.

import { Task } from '../models/task.model';
import { TaskDto, TaskWriteDto } from './task.dto';

/** API → dominio. Solo pasan los campos que el dominio usa: lo que la API añada de más no entra en la aplicación. */
export function mapearTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    userId: dto.userId,
    title: dto.title,
    completed: dto.completed,
    ...(dto.createdAt !== undefined && { createdAt: dto.createdAt }),
  };
}

/** Dominio → API (escrituras). `conId` indica si el cuerpo lleva el `id` (sustituir y restaurar sí; crear no). */
export function aTaskDto(task: Task, conId: boolean): TaskWriteDto {
  return {
    ...(conId && { id: task.id }),
    userId: task.userId,
    title: task.title,
    completed: task.completed,
    ...(task.createdAt !== undefined && { createdAt: task.createdAt }),
  };
}

/** Type guard de la forma que el mapper necesita de un elemento de la API (frontera de datos). */
function esTaskDto(valor: unknown): valor is TaskDto {
  if (typeof valor !== 'object' || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    typeof v['id'] === 'number' &&
    typeof v['userId'] === 'number' &&
    typeof v['title'] === 'string' &&
    typeof v['completed'] === 'boolean' &&
    (v['createdAt'] === undefined || typeof v['createdAt'] === 'string')
  );
}

/** Convierte un elemento JSON de la API en `Task`, o `null` si no tiene la forma esperada. */
export function leerTask(json: unknown): Task | null {
  return esTaskDto(json) ? mapearTask(json) : null;
}
