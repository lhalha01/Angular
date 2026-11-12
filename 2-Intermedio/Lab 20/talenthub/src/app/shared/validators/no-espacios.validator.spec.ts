import { FormControl } from '@angular/forms';
import { noSoloEspacios, sinEspacios } from './no-espacios.validator';

const valida = (validador: typeof sinEspacios, valor: unknown) => validador(new FormControl(valor));

describe('sinEspacios', () => {
  it('acepta un valor sin espacios', () => {
    expect(valida(sinEspacios, 'ana@example.com')).toBeNull();
  });

  it('rechaza espacios al principio, al final y en medio', () => {
    expect(valida(sinEspacios, ' ana@example.com')).toEqual({ espacios: true });
    expect(valida(sinEspacios, 'ana@example.com ')).toEqual({ espacios: true });
    expect(valida(sinEspacios, 'ana @example.com')).toEqual({ espacios: true });
  });

  it('rechaza también tabuladores y saltos de línea', () => {
    expect(valida(sinEspacios, 'ana\t@example.com')).toEqual({ espacios: true });
    expect(valida(sinEspacios, 'ana\n')).toEqual({ espacios: true });
  });

  it('un valor vacío o nulo es válido (de exigirlo se encarga required)', () => {
    expect(valida(sinEspacios, '')).toBeNull();
    expect(valida(sinEspacios, null)).toBeNull();
  });
});

describe('noSoloEspacios', () => {
  it('acepta un valor con texto, incluso con espacios alrededor o dentro', () => {
    expect(valida(noSoloEspacios, 'Ana')).toBeNull();
    expect(valida(noSoloEspacios, '  Ana María ')).toBeNull();
  });

  it('rechaza un valor formado solo por espacios', () => {
    expect(valida(noSoloEspacios, '   ')).toEqual({ soloEspacios: true });
    expect(valida(noSoloEspacios, '\t \n')).toEqual({ soloEspacios: true });
  });

  it('un valor vacío o nulo es válido (de exigirlo se encarga required)', () => {
    expect(valida(noSoloEspacios, '')).toBeNull();
    expect(valida(noSoloEspacios, null)).toBeNull();
  });
});
