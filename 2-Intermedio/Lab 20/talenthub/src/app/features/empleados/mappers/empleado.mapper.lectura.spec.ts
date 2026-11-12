import { leerEmpleado, leerEmpleados } from './empleado.mapper';

const valido = { id: 2, name: 'Ervin Howell', email: 'e@h.com', phone: '', website: '', company: { name: 'X' } };

describe('leerEmpleado / leerEmpleados (frontera de datos de la API)', () => {
  it('mapea un elemento con la forma esperada', () => {
    expect(leerEmpleado(valido)?.nombre).toBe('Ervin Howell');
  });

  it('devuelve null si falta un campo o tiene el tipo equivocado', () => {
    expect(leerEmpleado({ ...valido, id: '2' })).toBeNull();
    expect(leerEmpleado({ ...valido, name: undefined })).toBeNull();
    expect(leerEmpleado({ ...valido, email: 5 })).toBeNull();
    expect(leerEmpleado(null)).toBeNull();
    expect(leerEmpleado('texto')).toBeNull();
  });

  it('acepta los campos extra que envía el backend (address, company completa…)', () => {
    expect(leerEmpleado({ ...valido, address: { city: 'X' }, company: { name: 'X', bs: 'y' } })).not.toBeNull();
  });

  it('leerEmpleados descarta los inválidos y tolera lo que no es una lista', () => {
    expect(leerEmpleados([valido, { id: 'x' }, null]).length).toBe(1);
    expect(leerEmpleados({ no: 'lista' })).toEqual([]);
    expect(leerEmpleados(undefined)).toEqual([]);
  });
});
