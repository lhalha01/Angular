import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Empleado } from '../models/empleado.model';
import { EmpleadoService } from '../services/empleado.service';

/**
 * Carga el empleado de `:id` antes de activar la ruta del perfil, para que la pantalla no aparezca vacía.
 * Devuelve `null` si no existe o si la petición falla; el componente muestra entonces «no encontrado».
 */
export const empleadoResolver: ResolveFn<Empleado | null> = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(EmpleadoService)
    .getById(id)
    .pipe(catchError(() => of(null)));
};
