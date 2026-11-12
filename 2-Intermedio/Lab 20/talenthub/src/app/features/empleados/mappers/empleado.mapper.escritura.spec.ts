import { NuevoEmpleado } from '../models/empleado.model';
import { aNuevoEmpleadoDto } from './empleado.mapper';

describe('aNuevoEmpleadoDto (dominio → cuerpo de la API)', () => {
  const datos: NuevoEmpleado = {
    nombre: 'Marta Ruiz',
    email: 'marta@example.com',
    rol: 'devops',
    habilidades: [
      { nombre: 'Docker', nivel: 'mid' },
      { nombre: 'Terraform', nivel: 'senior' },
    ],
    disponible: false,
    proyectoActualId: 7,
  };

  it('envía el nombre, el email y todos los datos de empleado con los nombres de la API', () => {
    expect(aNuevoEmpleadoDto(datos)).toEqual({
      name: 'Marta Ruiz',
      email: 'marta@example.com',
      role: 'devops',
      skills: [
        { name: 'Docker', level: 'mid' },
        { name: 'Terraform', level: 'senior' },
      ],
      available: false,
      projectId: 7,
    });
  });

  it('un empleado sin proyecto ni habilidades envía projectId nulo y una lista vacía', () => {
    const dto = aNuevoEmpleadoDto({ ...datos, disponible: true, proyectoActualId: null, habilidades: [] });
    expect(dto.projectId).toBeNull();
    expect(dto.skills).toEqual([]);
    expect(dto.available).toBeTrue();
  });

  it('no envía la fecha de incorporación (la pone el servidor) ni deja pasar nombres del dominio', () => {
    expect(Object.keys(aNuevoEmpleadoDto(datos)).sort()).toEqual(['available', 'email', 'name', 'projectId', 'role', 'skills']);
  });
});
