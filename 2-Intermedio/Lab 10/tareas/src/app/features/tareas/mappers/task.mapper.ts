// Mapper: convierte entre el DTO de la API y el modelo de dominio `Task`, en los dos sentidos.
// Aísla al resto de la aplicación del formato de la API: si cambia, solo cambia este archivo.

import { DEFAULT_PRIORITY, isPriority, Task } from '../models/task.model';
import { TaskDto, TaskWriteDto } from './task.dto';

/**
 * API → dominio. Solo pasan los campos que el dominio usa: lo que la API añada de más no entra en la aplicación.
 * Si la API no trae prioridad (JSONPlaceholder), la tarea queda en la prioridad por defecto (`medium`).
 */
export function mapearTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    userId: dto.userId,
    title: dto.title,
    completed: dto.completed,
    priority: dto.priority ?? DEFAULT_PRIORITY,
    // La planificación vacía (`null`, `[]`) no entra en el dominio: ausente = sin valor.
    ...(dto.description && { description: dto.description }),
    ...(dto.startDate && { startDate: dto.startDate }),
    ...(dto.endDate && { endDate: dto.endDate }),
    ...(dto.tags && dto.tags.length > 0 && { tags: dto.tags }),
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
    priority: task.priority,
    description: task.description ?? null,
    startDate: task.startDate ?? null,
    endDate: task.endDate ?? null,
    tags: task.tags ?? [],
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
    (v['priority'] === undefined || isPriority(v['priority'])) &&
    (v['description'] == null || typeof v['description'] === 'string') &&
    (v['startDate'] == null || typeof v['startDate'] === 'string') &&
    (v['endDate'] == null || typeof v['endDate'] === 'string') &&
    (v['tags'] === undefined || (Array.isArray(v['tags']) && v['tags'].every((t) => typeof t === 'string'))) &&
    (v['createdAt'] === undefined || typeof v['createdAt'] === 'string')
  );
}

/** Convierte un elemento JSON de la API en `Task`, o `null` si no tiene la forma esperada. */
export function leerTask(json: unknown): Task | null {
  return esTaskDto(json) ? mapearTask(json) : null;
}
