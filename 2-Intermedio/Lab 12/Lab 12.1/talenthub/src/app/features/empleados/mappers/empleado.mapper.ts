// Mapper: convierte el DTO de la API en el modelo de dominio.
// Aísla al resto de la aplicación del formato de la API: si cambia, solo cambia este archivo.

import { Empleado, RolEmpleado } from '../models/empleado.model';
import { EmpleadoDto } from './empleado.dto';

export function mapearEmpleado(dto: EmpleadoDto): Empleado {
  return {
    id: dto.id,
    nombre: dto.name,
    email: dto.email,
    rol: 'desarrollador' as RolEmpleado, // valor por defecto hasta tener la API real
    habilidades: [],
    disponible: dto.id % 2 === 0, // simulado
    proyectoActualId: null,
    fechaIncorporacion: new Date(),
  };
}
