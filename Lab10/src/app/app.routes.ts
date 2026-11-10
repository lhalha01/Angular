import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { taskResolver } from './features/tasks/task.resolver';

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
        // Ruta padre sin componente: resuelve la tarea una vez y sus hijas la heredan
        // (junto al parámetro :id) como inputs. 'always' vuelve a resolverla tras editar,
        // para que el detalle no muestre datos antiguos.
        path: ':id',
        resolve: { task: taskResolver },
        runGuardsAndResolvers: 'always',
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
            canDeactivate: [unsavedChangesGuard],
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
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./features/tasks/add-task/add-task.component').then((m) => m.AddTaskComponent),
  },
  { path: '**', redirectTo: '' },
];
