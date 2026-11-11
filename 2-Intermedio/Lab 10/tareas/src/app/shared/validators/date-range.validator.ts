import { ValidatorFn } from '@angular/forms';

/**
 * Validador cruzado de un grupo con un campo de fecha de inicio y otro de fin: el fin no puede ser anterior al
 * inicio (el mismo día es válido). Si falta alguna de las dos fechas, o no se pueden leer, no hay nada que comparar.
 * El error se marca en el grupo (`endBeforeStart`), no en un campo concreto.
 */
export const dateRange =
  (startKey: string, endKey: string): ValidatorFn =>
  (group) => {
    const start = Date.parse(String(group.get(startKey)?.value ?? ''));
    const end = Date.parse(String(group.get(endKey)?.value ?? ''));
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return end >= start ? null : { endBeforeStart: true };
  };
