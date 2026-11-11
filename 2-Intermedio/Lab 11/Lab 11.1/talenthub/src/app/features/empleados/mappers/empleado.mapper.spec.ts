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
};

describe('mapearEmpleado', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('traduce los campos de la API al modelo de dominio', () => {
    const e = mapearEmpleado(dto);
    expect(e.id).toBe(2);
    expect(e.nombre).toBe('Ervin Howell');
    expect(e.email).toBe('Shanna@melissa.tv');
  });

  it('descarta los campos de la API que el dominio no usa', () => {
    const e = mapearEmpleado(dto) as unknown as Record<string, unknown>;
    for (const campo of ['name', 'phone', 'website', 'company']) {
      expect(campo in e).toBeFalse();
    }
  });

  it('asigna los valores por defecto: rol desarrollador, sin habilidades ni proyecto', () => {
    const e = mapearEmpleado(dto);
    expect(e.rol).toBe('desarrollador');
    expect(e.habilidades).toEqual([]);
    expect(e.proyectoActualId).toBeNull();
  });

  it('simula la disponibilidad: disponible si el id es par', () => {
    expect(mapearEmpleado({ ...dto, id: 2 }).disponible).toBeTrue();
    expect(mapearEmpleado({ ...dto, id: 3 }).disponible).toBeFalse();
  });

  it('fija la fecha de incorporación en el momento del mapeo', () => {
    const ahora = new Date(2025, 5, 1, 12, 0, 0);
    jasmine.clock().mockDate(ahora);
    expect(mapearEmpleado(dto).fechaIncorporacion).toEqual(ahora);
  });

  it('cada empleado recibe su propio array de habilidades (sin compartir referencia)', () => {
    const a = mapearEmpleado(dto);
    const b = mapearEmpleado(dto);
    a.habilidades.push({ nombre: 'TypeScript', nivel: 'mid' });
    expect(b.habilidades).toEqual([]);
  });

  it('el resultado es reconocido por el type guard esEmpleado', () => {
    expect(esEmpleado(mapearEmpleado(dto))).toBeTrue();
  });
});
