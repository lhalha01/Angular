import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';

/** Rutas de la feature `dashboard`, cargadas de forma diferida desde `app.routes.ts` (`/dashboard`). */
export const dashboardRoutes: Routes = [{ path: '', component: Dashboard, title: 'Dashboard' }];
