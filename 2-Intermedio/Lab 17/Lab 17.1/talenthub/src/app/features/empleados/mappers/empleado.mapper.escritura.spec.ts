import { NuevoEmpleado } from '../models/empleado.model';
import { aNuevoEmpleadoDto } from './empleado.mapper';

describe('aNuevoEmpleadoDto (dominio → cuerpo de la API)', () => {
  const datos: NuevoEmpleado = {
    nombre: 'Marta Ruiz',
    email: 'marta@example.com',
    rol: 'devops',
    habilidades: [{ nombre: 'Docker', nivel: 'mid' }],
    disponible: true,
    proyectoActualId: null,
  };

  it('envía solo name y email, que es lo que guarda la API', () => {
    expect(aNuevoEmpleadoDto(datos)).toEqual({ name: 'Marta Ruiz', email: 'marta@example.com' });
  });

  it('no filtra campos del dominio (rol, habilidades…) a la API', () => {
    expect(Object.keys(aNuevoEmpleadoDto(datos)).sort()).toEqual(['email', 'name']);
  });
});
