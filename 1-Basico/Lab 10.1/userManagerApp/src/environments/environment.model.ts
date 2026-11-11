/**
 * Parámetros que cambian según la configuración de compilación (véase `angular.json`).
 * Vive en su propio archivo porque `environment.ts` se sustituye por otro en cada configuración,
 * y la interfaz debe seguir existiendo.
 */
export interface Environment {
  /** URL base de la API (sin la `/` final). */
  apiUrl: string;
  /**
   * `false`: API de mentira (JSONPlaceholder), que no guarda los cambios; el servicio
   * mantiene el estado en memoria y simula las altas y bajas.
   * `true`: backend propio, que sí los guarda; el servicio usa lo que responde.
   */
  persistentApi: boolean;
}
