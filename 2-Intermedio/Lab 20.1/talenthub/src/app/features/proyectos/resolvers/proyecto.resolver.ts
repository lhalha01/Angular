import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Proyecto } from '../models/proyecto.model';
import { ProyectoService } from '../services/proyecto.service';

/**
 * Carga el proyecto de `:id` antes de activar la ruta del detalle. Devuelve `null` si no existe o si la petición falla; el
 * componente muestra entonces «no encontrado».
 */
export const proyectoResolver: ResolveFn<Proyecto | null> = (route) =>
  inject(ProyectoService)
    .getById(Number(route.paramMap.get('id')))
    .pipe(catchError(() => of(null)));
