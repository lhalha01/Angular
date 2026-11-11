/**
 * Parámetros que cambian según la configuración de compilación (véase `angular.json`).
 * Vive en su propio archivo porque `environment.ts` se sustituye por otro en cada configuración,
 * y la interfaz debe seguir existiendo.
 */
export interface Environment {
  /** URL base de la API (sin la `/` final). */
  apiUrl: string;
  /**
   * `false`: API de mentira (JSONPlaceholder), que no guarda los cambios; el estado se mantiene en
   * memoria y las respuestas y errores de las escrituras se ignoran (`ignoreServerOutcome`).
   * `true`: backend propio, que sí los guarda; se usa lo que responde (ids, fechas) y sus errores
   * llegan al usuario.
   */
  persistentApi: boolean;
}
