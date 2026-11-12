import { AsyncValidatorFn } from '@angular/forms';
import { map, timer } from 'rxjs';

/** Espera antes de «consultar» (simula la latencia de una petición y evita validar en cada tecla). */
export const ESPERA_EMAIL_UNICO_MS = 400;

/**
 * Validador asíncrono de email único. **Simulado**, como pide el enunciado: se considera duplicado cualquier email
 * que contenga «test» (sin distinguir mayúsculas). Un valor vacío no se comprueba (de exigirlo se encarga
 * `Validators.required`). El observable se completa, que es lo que necesita un validador asíncrono para emitir.
 */
export const emailUnicoValidator = (): AsyncValidatorFn => (control) => {
  const valor = String(control.value ?? '');
  if (valor === '') return timer(0).pipe(map(() => null));
  return timer(ESPERA_EMAIL_UNICO_MS).pipe(
    map(() => (valor.toLowerCase().includes('test') ? { emailDuplicado: true } : null)),
  );
};
