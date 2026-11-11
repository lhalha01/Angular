import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';
import { taskResolver } from './task.resolver';

/**
 * Rutas de la feature `tareas`. La aplicación las carga de una sola vez con `loadChildren`
 * (`app.routes.ts`) y cada pantalla sigue siendo un chunk propio (`loadComponent`). Las URLs son las
 * de siempre: `/tasks`, `/tasks/:id`, `/tasks/:id/edit` y `/add-task`.
 */
export const TAREAS_ROUTES: Routes = [
  {
    path: 'tasks',
    children: [
      {
        path: '',
        title: 'Tareas',
        loadComponent: () => import('./components/task-list/task-list.component').then((m) => m.TaskListComponent),
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
              import('./components/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
          },
          {
            path: 'edit',
            title: 'Editar tarea',
            canDeactivate: [unsavedChangesGuard],
            loadComponent: () =>
              import('./components/task-edit/task-edit.component').then((m) => m.TaskEditComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'add-task',
    title: 'Nueva tarea',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./components/add-task/add-task.component').then((m) => m.AddTaskComponent),
  },
];
