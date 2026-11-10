import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Inicio - Gestor de Usuarios',
  },
  {
    // Rutas hijas de /users: lista, detalle y edición (anidada).
    path: 'users',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/user-list/user-list').then((m) => m.UserList),
        title: 'Usuarios',
      },
      {
        path: ':id',
        loadComponent: () => import('./features/user-detail/user-detail').then((m) => m.UserDetail),
        title: 'Detalle de usuario',
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/user-edit/user-edit').then((m) => m.UserEdit),
        title: 'Editar usuario',
      },
    ],
  },
  {
    path: 'add-user',
    loadComponent: () => import('./features/add-user/add-user').then((m) => m.AddUser),
    title: 'Añadir usuario',
  },
  { path: '**', redirectTo: '' },
];
