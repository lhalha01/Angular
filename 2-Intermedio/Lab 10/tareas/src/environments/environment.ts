import { Environment } from './environment.model';

/**
 * Configuración base: API pública (JSONPlaceholder, no guarda cambios). La usan los tests y la
 * configuración explícita `public` (`npm run start:public`). `npm start` y `ng build` la sustituyen por
 * `environment.local.ts` (el backend propio), que es lo que usa el nivel Intermedio.
 */
export const environment: Environment = {
  apiUrl: 'https://jsonplaceholder.typicode.com',
  persistentApi: false,
};
