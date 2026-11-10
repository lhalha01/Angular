import { Routes } from "@angular/router"
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Home - Debug App',
  },
  {
    path: 'counter',
    loadComponent: () => import('./features/counter/counter').then((m) => m.Counter),
    title: 'Counter- Debug App',
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
