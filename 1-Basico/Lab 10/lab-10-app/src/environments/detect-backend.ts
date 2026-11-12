import { environment } from './environment';
import { Environment } from './environment.model';

/** Backend propio del repositorio (carpeta `backend/`). */
export const LOCAL_API: Environment = { apiUrl: 'http://localhost:8000', persistentApi: true };

/** API pública de respaldo: no guarda los cambios. */
export const PUBLIC_API: Environment = {
  apiUrl: 'https://jsonplaceholder.typicode.com',
  persistentApi: false,
};

/** Tiempo máximo de espera al backend: si no responde, se usa la API pública. */
const TIMEOUT_MS = 1500;

/**
 * Comprueba UNA sola vez, al arrancar, si el backend local está activo (`GET /health`) y deja
 * `environment` apuntando a él; si no responde a tiempo, apunta a JSONPlaceholder.
 *
 * Los servicios leen `environment` al usarse (después del arranque), así que no necesitan saber
 * nada de esto. Para cambiar de fuente hay que recargar la página.
 *
 * @returns `true` si se usa el backend local.
 */
export async function detectBackend(
  target: Environment = environment,
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
  timeoutMs: number = TIMEOUT_MS,
): Promise<boolean> {
  let local = false;
  try {
    const response = await fetchFn(`${LOCAL_API.apiUrl}/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    local = response.ok && ((await response.json()) as { status?: string }).status === 'ok';
  } catch {
    local = false; // sin red, rechazado o fuera de tiempo: no hay backend
  }
  Object.assign(target, local ? LOCAL_API : PUBLIC_API);
  console.info(
    local
      ? `Backend local detectado: se usa ${LOCAL_API.apiUrl} (los cambios se guardan).`
      : `Backend local no disponible: se usa JSONPlaceholder (los cambios no se guardan).`,
  );
  return local;
}
