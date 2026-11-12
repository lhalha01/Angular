import { ValidatorFn } from '@angular/forms';

/**
 * Solo letras (con tildes y ñ) y espacios. Un valor vacío es válido para este validador: de exigir el campo se
 * encarga `Validators.required`, así el usuario no ve dos errores a la vez.
 */
export const soloLetrasYEspacios: ValidatorFn = (control) => {
  const valor = String(control.value ?? '');
  return valor === '' || /^[a-zA-ZÀ-ɏñÑ\s]+$/.test(valor) ? null : { soloLetras: true };
};
