// Barrel de la feature `empleados`: su API pública. El resto de la aplicación importa de aquí
// (`@features/empleados`) y nunca de una ruta interna.
//
// Los tipos se reexportan con `export type` (el proyecto usa `isolatedModules`). El DTO de la API


export { EmpleadosFacade } from './services/empleados.facade';
export { EmpleadoService } from './services/empleado.service';
export type {
  ActualizarEmpleado,
  Empleado,
  EmpleadoResumen,
  Habilidad,
  NuevoEmpleado,
  RolEmpleado,
} from './models/empleado.model';
export { esEmpleado } from './models/empleado.model';
