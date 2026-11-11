import { Routes } from '@angular/router';
import { ListaProyectos } from './components/lista-proyectos/lista-proyectos.component';

/** Rutas de la feature `proyectos`, cargadas de forma diferida desde `app.routes.ts` (`/proyectos`). */
export const proyectosRoutes: Routes = [{ path: '', component: ListaProyectos, title: 'Proyectos' }];
