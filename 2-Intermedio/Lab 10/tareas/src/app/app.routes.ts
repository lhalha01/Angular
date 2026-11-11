import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

/**
 * Cada feature se carga de forma diferida a través de su punto de entrada: el barrel (`@features/home`) o su
 * archivo de rutas (`@features/tareas/tareas.routes`). Todo salvo el login exige sesión: `canMatch` impide
 * incluso descargar los chunks de las pantallas protegidas sin autenticarse.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Acceso',
    loadComponent: () => import('@core/login/login.component').then((m) => m.Login),
  },
  {
    path: '',
    canMatch: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Inicio',
        loadComponent: () => import('@features/home').then((m) => m.HomeComponent),
      },
      {
        path: '',
        loadChildren: () => import('@features/tareas/tareas.routes').then((m) => m.TAREAS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
