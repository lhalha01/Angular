import {
  ActualizarEmpleado,
  Empleado,
  EmpleadoResumen,
  NuevoEmpleado,
  RolEmpleado,
  esEmpleado,
} from './empleado.model';

const empleado: Empleado = {
  id: 1,
  nombre: 'Ana Pérez',
  email: 'ana@talenthub.com',
  rol: 'qa',
  habilidades: [{ nombre: 'Cypress', nivel: 'senior' }],
  disponible: true,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2024, 0, 15),
};

describe('esEmpleado (type guard)', () => {
  it('acepta un empleado completo', () => {
    expect(esEmpleado(empleado)).toBeTrue();
  });

  it('rechaza null, undefined y valores primitivos', () => {
    for (const valor of [null, undefined, 42, 'texto', true]) {
      expect(esEmpleado(valor)).toBeFalse();
    }
  });

  it('rechaza objetos a los que les falta nombre, email o rol', () => {
    expect(esEmpleado({ email: 'a@b.c', rol: 'qa' })).toBeFalse();
    expect(esEmpleado({ nombre: 'Ana', rol: 'qa' })).toBeFalse();
    expect(esEmpleado({ nombre: 'Ana', email: 'a@b.c' })).toBeFalse();
    expect(esEmpleado({})).toBeFalse();
  });

  it('estrecha el tipo de `unknown` a `Empleado`', () => {
    const recibido: unknown = JSON.parse(JSON.stringify(empleado));
    if (esEmpleado(recibido)) {
      // Dentro del `if`, TypeScript permite acceder a las propiedades tipadas.
      expect(recibido.nombre.toUpperCase()).toBe('ANA PÉREZ');
    } else {
      fail('debería haberse reconocido como empleado');
    }
  });
});

// Contratos de tipos: cada `@ts-expect-error` falla la compilación si el tipo deja de
// rechazar el caso (por ejemplo, si alguien relaja un Utility Type).
describe('contratos de tipos de Empleado', () => {
  it('NuevoEmpleado no admite id ni fechaIncorporacion', () => {
    const nuevo: NuevoEmpleado = {
      nombre: 'Luis',
      email: 'luis@talenthub.com',
      rol: 'devops',
      habilidades: [],
      disponible: true,
      proyectoActualId: null,
    };
    const conId: NuevoEmpleado = {
      ...nuevo,
      // @ts-expect-error `id` lo asigna el sistema, no forma parte de NuevoEmpleado
      id: 5,
    };
    expect(nuevo.nombre).toBe('Luis');
    expect(conId).toBeDefined();
  });

  it('ActualizarEmpleado solo permite rol, disponible, proyectoActualId y habilidades', () => {
    const parcial: ActualizarEmpleado = { disponible: false };
    const vacio: ActualizarEmpleado = {}; // todos los campos son opcionales
    const conNombre: ActualizarEmpleado = {
      // @ts-expect-error el nombre no se puede actualizar por esta vía
      nombre: 'Otro',
    };
    expect(parcial.disponible).toBeFalse();
    expect(vacio).toEqual({});
    expect(conNombre).toBeDefined();
  });

  it('RolEmpleado solo admite los cinco roles definidos', () => {
    const roles: RolEmpleado[] = ['desarrollador', 'diseñador', 'qa', 'devops', 'manager'];
    // @ts-expect-error 'cocinero' no es un rol válido
    const invalido: RolEmpleado = 'cocinero';
    expect(roles.length).toBe(5);
    expect(invalido).toBeDefined();
  });

  it('EmpleadoResumen se obtiene de Empleado con solo los campos del listado', () => {
    const resumen: EmpleadoResumen = {
      id: empleado.id,
      nombre: empleado.nombre,
      email: empleado.email,
      rol: empleado.rol,
      disponible: empleado.disponible,
    };
    // @ts-expect-error `habilidades` no forma parte de EmpleadoResumen
    const { habilidades } = resumen;
    expect(habilidades).toBeUndefined();
  });
});
