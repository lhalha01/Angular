import { ProyectoDto } from './proyecto.dto';
import { leerProyecto, leerProyectos, mapearProyecto } from './proyecto.mapper';

const dto: ProyectoDto = { id: 5, userId: 3, title: 'Migrar la base de datos', completed: false, createdAt: '2026-03-01T10:00:00.000Z' };

describe('mapearProyecto', () => {
  it('traduce los campos de la API al modelo de dominio', () => {
    const p = mapearProyecto(dto);
    expect(p.id).toBe(5);
    expect(p.nombre).toBe('Migrar la base de datos');
    expect(p.cliente).toBe('Cliente 3');
    expect(p.empleadosIds).toEqual([3]);
  });

  it('una tarea pendiente es un proyecto activo, sin fecha de fin', () => {
    const p = mapearProyecto(dto);
    expect(p.estado).toBe('activo');
    expect(p.fechaFin).toBeNull();
  });

  it('una tarea completada es un proyecto completado, con fecha de fin', () => {
    const p = mapearProyecto({ ...dto, completed: true });
    expect(p.estado).toBe('completado');
    expect(p.fechaFin).toEqual(p.fechaInicio);
  });

  it('usa la fecha de creación de la API como inicio y tolera que no venga (API pública)', () => {
    expect(mapearProyecto(dto).fechaInicio.toISOString()).toBe('2026-03-01T10:00:00.000Z');
    const sinFecha = { ...dto, createdAt: undefined };
    expect(mapearProyecto(sinFecha).fechaInicio instanceof Date).toBeTrue();
  });

  it('no deja pasar campos del DTO que el dominio no usa', () => {
    const p = mapearProyecto(dto) as unknown as Record<string, unknown>;
    expect('title' in p).toBeFalse();
    expect('completed' in p).toBeFalse();
    expect('userId' in p).toBeFalse();
  });
});

describe('leerProyecto / leerProyectos (frontera de datos de la API)', () => {
  it('mapea un elemento con la forma esperada', () => {
    expect(leerProyecto(dto)?.nombre).toBe('Migrar la base de datos');
  });

  it('devuelve null si falta un campo o tiene el tipo equivocado', () => {
    expect(leerProyecto({ ...dto, id: '5' })).toBeNull();
    expect(leerProyecto({ ...dto, userId: undefined })).toBeNull();
    expect(leerProyecto({ ...dto, title: 3 })).toBeNull();
    expect(leerProyecto({ ...dto, completed: 'no' })).toBeNull();
    expect(leerProyecto(null)).toBeNull();
  });

  it('leerProyectos descarta los inválidos y tolera lo que no es una lista', () => {
    expect(leerProyectos([dto, { id: 'x' }, null]).length).toBe(1);
    expect(leerProyectos({ no: 'lista' })).toEqual([]);
    expect(leerProyectos(undefined)).toEqual([]);
  });
});
