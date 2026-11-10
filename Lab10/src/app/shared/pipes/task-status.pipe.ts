import { Pipe, PipeTransform } from '@angular/core';

/** Convierte el booleano `completed` en un texto con emoji. */
@Pipe({ name: 'taskStatus' })
export class TaskStatusPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    return value ? 'Completada ✅' : 'Pendiente ⏳';
  }
}
