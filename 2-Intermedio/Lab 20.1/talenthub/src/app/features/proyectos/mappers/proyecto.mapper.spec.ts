import { ProyectoDto } from './proyecto.dto';
import { leerEquipo, leerProyecto, leerProyectos, mapearProyecto } from './proyecto.mapper';

const dto: ProyectoDto = {
  id: 5,
  name: 'Migrar la base de datos',
  client: 'Acme Corp',
  status: 'active',
  startDate: '2026-03-01',
  endDate: null,
  memberIds: [1, 3],
};

describe('mapearProyecto', () => {
  it('traduce los campos de la API al modelo de dominio', () => {
    const p = mapearProyecto(dto);
    expect(p.id).toBe(5);
    expect(p.nombre).toBe('Migrar la base de datos');
    expect(p.cliente).toBe('Acme Corp');
    expect(p.empleadosIds).toEqual([1, 3]);
  });

  it('traduce los tres estados de la API (en inglés) a los del dominio', () => {
    expect(mapearProyecto({ ...dto, status: 'active' }).estado).toBe('activo');
    expect(mapearProyecto({ ...dto, status: 'paused' }).estado).toBe('pausado');
    expect(mapearProyecto({ ...dto, status: 'completed' }).estado).toBe('completado');
  });

  it('lee los días como fechas locales (sin desfase de zona horaria) y la fecha de fin nula como null', () => {
    const p = mapearProyecto({ ...dto, endDate: '2026-06-30' });
    expect([p.fechaInicio.getFullYear(), p.fechaInicio.getMonth(), p.fechaInicio.getDate()]).toEqual([2026, 2, 1]);
    expect([p.fechaFin?.getFullYear(), p.fechaFin?.getMonth(), p.fechaFin?.getDate()]).toEqual([2026, 5, 30]);
    expect(mapearProyecto(dto).fechaFin).toBeNull();
  });

  it('un día mal formado da una fecha inválida en lugar de romper', () => {
    expect(Number.isNaN(mapearProyecto({ ...dto, startDate: 'ayer' }).fechaInicio.getTime())).toBeTrue();
  });

  it('el equipo es una copia (no comparte el array con el DTO)', () => {
    const p = mapearProyecto(dto);
    p.empleadosIds.push(9);
    expect(dto.memberIds).toEqual([1, 3]);
  });

  it('no deja pasar campos del DTO que el dominio no usa', () => {
    const p = mapearProyecto(dto) as unknown as Record<string, unknown>;
    for (const campo of ['name', 'client', 'status', 'startDate', 'endDate', 'memberIds']) {
      expect(campo in p).toBeFalse();
    }
  });
});

describe('leerProyecto / leerProyectos (frontera de datos de la API)', () => {
  it('mapea un elemento con la forma esperada', () => {
    expect(leerProyecto(dto)?.nombre).toBe('Migrar la base de datos');
  });

  it('devuelve null si falta un campo, tiene el tipo equivocado o el estado no existe', () => {
    expect(leerProyecto({ ...dto, id: '5' })).toBeNull();
    expect(leerProyecto({ ...dto, name: undefined })).toBeNull();
    expect(leerProyecto({ ...dto, client: 3 })).toBeNull();
    expect(leerProyecto({ ...dto, status: 'activo' })).toBeNull();
    expect(leerProyecto({ ...dto, startDate: 20260301 })).toBeNull();
    expect(leerProyecto({ ...dto, endDate: 5 })).toBeNull();
    expect(leerProyecto({ ...dto, memberIds: 'no' })).toBeNull();
    expect(leerProyecto({ ...dto, memberIds: [1, 'x'] })).toBeNull();
    expect(leerProyecto(null)).toBeNull();
  });

  it('leerProyectos descarta los inválidos y tolera lo que no es una lista', () => {
    expect(leerProyectos([dto, { id: 'x' }, null]).length).toBe(1);
    expect(leerProyectos({ no: 'lista' })).toEqual([]);
    expect(leerProyectos(undefined)).toEqual([]);
  });
});

describe('leerEquipo', () => {
  const usuarios = [
    { id: 1, name: 'Leanne Graham', email: 'a@a.com' },
    { id: 3, name: 'Clementine Bauch', email: 'c@c.com' },
  ];

  it('devuelve las personas de la lista, con su nombre', () => {
    expect(leerEquipo(usuarios)).toEqual([
      { id: 1, nombre: 'Leanne Graham' },
      { id: 3, nombre: 'Clementine Bauch' },
    ]);
  });

  it('descarta los elementos inválidos y tolera lo que no es una lista', () => {
    expect(leerEquipo([...usuarios, { id: 'x' }, null, { id: 4 }])).toEqual([
      { id: 1, nombre: 'Leanne Graham' },
      { id: 3, nombre: 'Clementine Bauch' },
    ]);
    expect(leerEquipo({ no: 'lista' })).toEqual([]);
  });
});
