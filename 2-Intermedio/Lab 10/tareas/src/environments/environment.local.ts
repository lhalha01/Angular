import { Environment } from './environment.model';

/**
 * Configuración `local`: backend propio de la carpeta `backend/` del repositorio
 * (FastAPI + SQLite). Es la configuración por defecto de `npm start` y de `ng build` en el Intermedio.
 */
export const environment: Environment = {
  apiUrl: 'http://localhost:8000',
  persistentApi: true,
};
