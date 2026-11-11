import { Routes } from '@angular/router';

/**
 * Cada feature se carga de forma diferida a través de su punto de entrada: el barrel
 * (`@features/home`) o su archivo de rutas (`@features/tareas/tareas.routes`).
 */
export const routes: Routes = [
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
  { path: '**', redirectTo: '' },
];
