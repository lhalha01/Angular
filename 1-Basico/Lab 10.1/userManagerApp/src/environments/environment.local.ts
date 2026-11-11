import { Environment } from './environment.model';

/**
 * Configuración `local`: backend propio de la carpeta `backend/` del repositorio
 * (FastAPI + SQLite). Se activa con `npm run start:local`.
 */
export const environment: Environment = {
  apiUrl: 'http://localhost:8000',
  persistentApi: true,
};
