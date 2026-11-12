import { Injectable } from '@angular/core';

/**
 * Acceso a los datos de empleados (patrón Repository: abstrae el origen, hoy el backend local).
 *
 * De momento es un esqueleto: el Lab 12 solo establece la estructura y el barrel de la feature, que necesita
 * exportar el servicio. Los métodos (listar, obtener por id, alta) llegan en los laboratorios siguientes,
 * cuando se trabaje la capa HTTP.
 */
@Injectable({ providedIn: 'root' })
export class EmpleadoService {}
