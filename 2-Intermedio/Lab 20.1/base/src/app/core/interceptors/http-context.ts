import { HttpContextToken } from '@angular/common/http';

/**
 * Si es `false`, el interceptor de errores no avisa del 404 de esa petición. Se usa cuando el 404 es una respuesta
 * esperada y no un fallo (p. ej. `getById`: «ese empleado no existe» devuelve `null`).
 */
export const NOTIFICAR_404 = new HttpContextToken<boolean>(() => true);
