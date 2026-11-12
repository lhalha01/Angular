import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

/**
 * Rutas principales. Cada feature se carga de forma diferida (un chunk por feature) y todo lo que va dentro
 * del armazón (`Shell`) exige sesión: `canMatch` impide incluso descargar el chunk sin autenticarse.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    title: 'Acceso',
    loadComponent: () => import('@core/login/login.component').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('@core/layout/shell/shell.component').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('@features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: 'empleados',
        loadChildren: () => import('@features/empleados/empleados.routes').then((m) => m.empleadosRoutes),
      },
      {
        path: 'proyectos',
        loadChildren: () => import('@features/proyectos/proyectos.routes').then((m) => m.proyectosRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
