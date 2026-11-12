import { ValidatorFn } from '@angular/forms';

/**
 * Validador cruzado de un grupo con los campos `disponible` y `proyectoActualId`: un empleado que no está disponible
 * (está ocupado) debe tener un proyecto asignado. El error se marca en el grupo, no en un campo concreto.
 */
export const proyectoObligatorioSiOcupado: ValidatorFn = (group) => {
  const disponible = group.get('disponible')?.value;
  const proyectoId = group.get('proyectoActualId')?.value;
  return !disponible && (proyectoId === null || proyectoId === undefined || proyectoId === '')
    ? { proyectoObligatorio: true }
    : null;
};
