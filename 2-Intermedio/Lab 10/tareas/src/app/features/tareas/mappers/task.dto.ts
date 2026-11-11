// DTO: forma exacta de las tareas que devuelve la API (`/todos`: JSONPlaceholder o el backend propio).
// Solo debe importarlo `task.mapper.ts`; el resto de la aplicación usa el modelo `Task` (lo hace cumplir la regla
// `no-restricted-imports` de eslint.config.js).

import { Priority } from '../models/task.model';

export interface TaskDto {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
  /** Solo la devuelve el backend propio; JSONPlaceholder no tiene prioridad. */
  priority?: Priority;
  /** Fecha ISO de creación. Solo la devuelve el backend propio; JSONPlaceholder no. */
  createdAt?: string;
}

/** Cuerpo de las escrituras (POST/PUT): lo que acepta la API. Sin `id` al crear; con `id` y `createdAt` al restaurar. */
export interface TaskWriteDto {
  id?: number;
  userId: number;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt?: string;
}
