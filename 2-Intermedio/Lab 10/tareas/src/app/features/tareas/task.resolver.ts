import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Task } from './models/task.model';
import { TaskService } from './services/task.service';

/**
 * Carga la tarea del parámetro `:id` antes de activar la ruta. Detalle y edición la
 * reciben ya resuelta como `input()` (`null` si no existe), sin repetir la carga ni
 * tener que gestionar un estado "cargando" cada una.
 */
export const taskResolver: ResolveFn<Task | null> = (route) =>
  inject(TaskService).getTaskById(Number(route.paramMap.get('id')));
