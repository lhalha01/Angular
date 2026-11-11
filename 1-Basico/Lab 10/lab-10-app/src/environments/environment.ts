import { Environment } from './environment.model';

/** Configuración por defecto: API pública, sin instalar nada más. */
export const environment: Environment = {
  apiUrl: 'https://jsonplaceholder.typicode.com',
  persistentApi: false,
};
