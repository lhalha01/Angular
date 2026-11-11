import { Routes } from '@angular/router';
import { cambiosPendientesGuard } from '@core/guards/cambios-pendientes.guard';
import { DirectorioEmpleados } from './components/directorio/directorio.component';
import { FormularioAlta } from './components/formulario-alta/formulario-alta.component';
import { PerfilEmpleado } from './components/perfil/perfil.component';
import { empleadoResolver } from './resolvers/empleado.resolver';

/**
 * Rutas de la feature `empleados`, cargadas de forma diferida desde `app.routes.ts` (`/empleados/...`).
 * `nuevo` va antes que `:id` para que no se tome «nuevo» por un identificador.
 */
export const empleadosRoutes: Routes = [
  { path: '', component: DirectorioEmpleados, title: 'Directorio' },
  {
    path: 'nuevo',
    component: FormularioAlta,
    title: 'Alta de empleado',
    canDeactivate: [cambiosPendientesGuard],
  },
  {
    path: ':id',
    component: PerfilEmpleado,
    title: 'Perfil de empleado',
    resolve: { empleado: empleadoResolver },
  },
];
