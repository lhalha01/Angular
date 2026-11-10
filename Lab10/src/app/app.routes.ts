import { Routes } from '@angular/router';

/** Componentes cargados de forma diferida (un chunk por pantalla). */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Inicio',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'tasks',
    children: [
      {
        path: '',
        title: 'Tareas',
        loadComponent: () => import('./features/tasks/task-list/task-list.component').then((m) => m.TaskListComponent),
      },
      {
        // Ruta padre sin componente: sus hijas heredan el parámetro :id.
        path: ':id',
        children: [
          {
            path: '',
            title: 'Detalle de tarea',
            loadComponent: () =>
              import('./features/tasks/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
          },
          {
            path: 'edit',
            title: 'Editar tarea',
            loadComponent: () =>
              import('./features/tasks/task-edit/task-edit.component').then((m) => m.TaskEditComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'add-task',
    title: 'Nueva tarea',
    loadComponent: () => import('./features/tasks/add-task/add-task.component').then((m) => m.AddTaskComponent),
  },
  { path: '**', redirectTo: '' },
];
