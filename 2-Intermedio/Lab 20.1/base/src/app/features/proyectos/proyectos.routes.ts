import { Routes } from '@angular/router';
import { DetalleProyecto } from './components/detalle-proyecto/detalle-proyecto.component';
import { ListaProyectos } from './components/lista-proyectos/lista-proyectos.component';
import { proyectoResolver } from './resolvers/proyecto.resolver';

/** Rutas de la feature `proyectos`, cargadas de forma diferida desde `app.routes.ts` (`/proyectos` y `/proyectos/:id`). */
export const proyectosRoutes: Routes = [
  { path: '', component: ListaProyectos, title: 'Proyectos' },
  {
    path: ':id',
    component: DetalleProyecto,
    title: 'Detalle de proyecto',
    resolve: { proyecto: proyectoResolver },
  },
];
