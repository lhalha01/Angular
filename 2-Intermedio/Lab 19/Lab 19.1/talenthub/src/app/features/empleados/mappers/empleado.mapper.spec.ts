import { esEmpleado } from '../models/empleado.model';
import { EmpleadoDto } from './empleado.dto';
import { mapearEmpleado } from './empleado.mapper';

const dto: EmpleadoDto = {
  id: 2,
  name: 'Ervin Howell',
  email: 'Shanna@melissa.tv',
  phone: '010-692-6593 x09125',
  website: 'anastasia.net',
  company: { name: 'Deckow-Crist' },
  role: 'diseñador',
  skills: [
    { name: 'Figma', level: 'senior' },
    { name: 'Angular', level: 'junior' },
  ],
  available: false,
  projectId: 8,
  hiredAt: '2023-03-06',
};

describe('mapearEmpleado', () => {
  it('traduce los campos de la API al modelo de dominio', () => {
    const e = mapearEmpleado(dto);
    expect(e.id).toBe(2);
    expect(e.nombre).toBe('Ervin Howell');
    expect(e.email).toBe('Shanna@melissa.tv');
  });

  it('descarta los campos de la API que el dominio no usa', () => {
    const e = mapearEmpleado(dto) as unknown as Record<string, unknown>;
    for (const campo of ['name', 'phone', 'website', 'company', 'role', 'skills', 'available', 'projectId', 'hiredAt']) {
      expect(campo in e).toBeFalse();
    }
  });

  it('toma de la API el rol, las habilidades, la disponibilidad y el proyecto', () => {
    const e = mapearEmpleado(dto);
    expect(e.rol).toBe('diseñador');
    expect(e.habilidades).toEqual([
      { nombre: 'Figma', nivel: 'senior' },
      { nombre: 'Angular', nivel: 'junior' },
    ]);
    expect(e.disponible).toBeFalse();
    expect(e.proyectoActualId).toBe(8);
  });

  it('lee el día de incorporación como fecha local (sin desfase de zona horaria)', () => {
    const fecha = mapearEmpleado(dto).fechaIncorporacion;
    expect([fecha.getFullYear(), fecha.getMonth(), fecha.getDate()]).toEqual([2023, 2, 6]);
  });

  it('un servidor que aún no trae los datos de empleado da un desarrollador disponible, sin proyecto', () => {
    const e = mapearEmpleado({ id: 1, name: 'Ana', email: 'ana@example.com' });
    expect(e.rol).toBe('desarrollador');
    expect(e.habilidades).toEqual([]);
    expect(e.disponible).toBeTrue();
    expect(e.proyectoActualId).toBeNull();
    expect(e.fechaIncorporacion instanceof Date).toBeTrue();
  });

  it('un rol desconocido se toma como desarrollador y las habilidades inválidas se descartan', () => {
    const e = mapearEmpleado({
      ...dto,
      role: 'jefe',
      skills: [{ name: 'Figma', level: 'experto' }, { name: 'Docker', level: 'mid' }, { level: 'mid' } as never],
    });
    expect(e.rol).toBe('desarrollador');
    expect(e.habilidades).toEqual([{ nombre: 'Docker', nivel: 'mid' }]);
  });

  it('una fecha de incorporación ilegible o nula se sustituye por la de hoy', () => {
    expect(mapearEmpleado({ ...dto, hiredAt: null }).fechaIncorporacion instanceof Date).toBeTrue();
    expect(mapearEmpleado({ ...dto, hiredAt: 'ayer' }).fechaIncorporacion.getTime()).not.toBeNaN();
  });

  it('el proyecto nulo o no numérico es «sin proyecto»', () => {
    expect(mapearEmpleado({ ...dto, projectId: null }).proyectoActualId).toBeNull();
    expect(mapearEmpleado({ ...dto, projectId: undefined }).proyectoActualId).toBeNull();
  });

  it('cada empleado recibe su propio array de habilidades (sin compartir referencia)', () => {
    const a = mapearEmpleado(dto);
    const b = mapearEmpleado(dto);
    a.habilidades.push({ nombre: 'Kotlin', nivel: 'mid' });
    expect(b.habilidades.length).toBe(2);
  });

  it('el resultado es reconocido por el type guard esEmpleado', () => {
    expect(esEmpleado(mapearEmpleado(dto))).toBeTrue();
  });
});
