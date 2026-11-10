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
    path: 'users',
    loadComponent: () => import('./features/user-list/user-list').then((m) => m.UserList),
    title: 'Users - Debug App',
  },
  {
    path: 'directives',
    loadComponent: () =>
      import('./features/directives/directives').then((m) => m.Directives),
    title: 'Directives',
  },
  {
    path: 'databindings',
    loadComponent: () =>
      import('./features/data.bindings/data.bindings').then((m) => m.DataBindings),
    title: 'Databindings',
  },
  {
    path: 'pipes',
    loadComponent: () =>
      import('./features/pipes/pipes').then((m) => m.Pipes),
    title: 'Pipes',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/product-list/product-list').then((m) => m.ProductList),
    title: 'Products',
  },
  {
    path: 'products/category/:category',
    loadComponent: () =>
      import('./features/product-list/product-list').then((m) => m.ProductList),
    title: 'Products',
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
