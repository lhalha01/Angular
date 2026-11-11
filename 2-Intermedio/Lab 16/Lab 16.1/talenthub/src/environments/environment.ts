/**
 * Configuración de la aplicación. TalentHub usa siempre las APIs locales del backend propio (`backend/`
 * en la raíz del repositorio: FastAPI + SQLite), que hay que arrancar antes (`start.cmd` / `start.sh`).
 */
export const environment = {
  apiUrl: 'http://localhost:8000',
};
