import { ValidatorFn } from '@angular/forms';

/**
 * El valor no puede contener ningún espacio (ni al principio, ni al final, ni dentro): para el email. Un valor vacío es
 * válido para este validador (de exigirlo se encarga `Validators.required`).
 */
export const sinEspacios: ValidatorFn = (control) => {
  const valor = String(control.value ?? '');
  return /\s/.test(valor) ? { espacios: true } : null;
};

/**
 * El valor no puede estar formado solo por espacios: `Validators.required` da por bueno «   », porque no está vacío.
 * Un valor vacío es válido para este validador.
 */
export const noSoloEspacios: ValidatorFn = (control) => {
  const valor = String(control.value ?? '');
  return valor !== '' && valor.trim() === '' ? { soloEspacios: true } : null;
};
