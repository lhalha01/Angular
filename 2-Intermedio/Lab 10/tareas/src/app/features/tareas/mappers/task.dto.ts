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
  /** Planificación: solo la devuelve el backend propio (vacía: `null`, `null`, `null` y `[]`). */
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
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
  /** Siempre se envían (vacíos como `null` y `[]`): así un PUT también borra lo que el usuario ha vaciado. */
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  createdAt?: string;
}
