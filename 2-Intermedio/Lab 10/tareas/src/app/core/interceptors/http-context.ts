import { HttpContextToken } from '@angular/common/http';

/** Qué se intentaba hacer («No se pudo eliminar la tarea»): el interceptor de errores lo usa como principio del aviso. */
export const OPERACION = new HttpContextToken<string>(() => '');

/**
 * Estados de error que maneja el propio llamante y que, por tanto, el interceptor no debe avisar
 * (p. ej. `[404]` al consultar un id que puede no existir, o `[409]` al restaurar una tarea con el id ocupado).
 */
export const ERRORES_ESPERADOS = new HttpContextToken<readonly number[]>(() => []);

/** Si es `false`, el interceptor no avisa de ningún error de esa petición (la API de mentira ignora sus fallos). */
export const NOTIFICAR_ERRORES = new HttpContextToken<boolean>(() => true);
