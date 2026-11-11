import { fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { emailUnicoValidator, ESPERA_EMAIL_UNICO_MS } from './email-unico.validator';
import { proyectoObligatorioSiOcupado } from './proyecto-obligatorio.validator';
import { soloLetrasYEspacios } from './solo-letras.validator';

describe('soloLetrasYEspacios', () => {
  const validar = (valor: unknown) => soloLetrasYEspacios(new FormControl(valor));

  it('acepta letras, tildes, ñ y espacios', () => {
    for (const ok of ['Ana', 'José Ángel', 'Núñez de la Peña', 'ÑAndú', 'Ana  María']) expect(validar(ok)).toBeNull();
  });

  it('rechaza dígitos, signos y símbolos', () => {
    for (const mal of ['Ana2', 'R2-D2', 'ana@example.com', 'Ana.', 'Ana_', '<b>', '1']) {
      expect(validar(mal)).toEqual({ soloLetras: true });
    }
  });

  it('un valor vacío o nulo es válido (de exigirlo se encarga required)', () => {
    expect(validar('')).toBeNull();
    expect(validar(null)).toBeNull();
    expect(validar(undefined)).toBeNull();
  });

  it('un valor de solo espacios cuenta como espacios válidos', () => {
    expect(validar('   ')).toBeNull();
  });
});

describe('emailUnicoValidator', () => {
  const validar = (valor: unknown): Observable<unknown> =>
    emailUnicoValidator()(new FormControl(valor) as AbstractControl) as Observable<unknown>;

  it('marca como duplicado un email que contiene «test», sin distinguir mayúsculas', fakeAsync(() => {
    const resultados: unknown[] = [];
    for (const email of ['test@example.com', 'ana.TEST@example.com', 'contest@x.com']) {
      validar(email).subscribe((r) => resultados.push(r));
    }
    tick(ESPERA_EMAIL_UNICO_MS);
    expect(resultados).toEqual([{ emailDuplicado: true }, { emailDuplicado: true }, { emailDuplicado: true }]);
  }));

  it('acepta los demás emails (null)', fakeAsync(() => {
    let resultado: unknown = 'sin respuesta';
    validar('ana@example.com').subscribe((r) => (resultado = r));
    tick(ESPERA_EMAIL_UNICO_MS);
    expect(resultado).toBeNull();
  }));

  it('espera 400 ms antes de responder (simula la latencia de la consulta)', fakeAsync(() => {
    let resultado: unknown = 'sin respuesta';
    validar('ana@example.com').subscribe((r) => (resultado = r));
    tick(ESPERA_EMAIL_UNICO_MS - 1);
    expect(resultado).toBe('sin respuesta');
    tick(1);
    expect(resultado).toBeNull();
  }));

  it('un valor vacío no se comprueba y responde enseguida', fakeAsync(() => {
    let resultado: unknown = 'sin respuesta';
    validar('').subscribe((r) => (resultado = r));
    tick(0);
    expect(resultado).toBeNull();
  }));

  it('el observable se completa (un validador asíncrono lo necesita para emitir)', fakeAsync(() => {
    let completo = false;
    validar('ana@example.com').subscribe({ complete: () => (completo = true) });
    tick(ESPERA_EMAIL_UNICO_MS);
    expect(completo).toBeTrue();
  }));
});

describe('proyectoObligatorioSiOcupado', () => {
  const grupo = (disponible: boolean, proyectoActualId: number | null | string | undefined) =>
    new FormGroup({ disponible: new FormControl(disponible), proyectoActualId: new FormControl(proyectoActualId) });
  const validar = (g: FormGroup) => proyectoObligatorioSiOcupado(g);

  it('un empleado disponible no necesita proyecto', () => {
    expect(validar(grupo(true, null))).toBeNull();
    expect(validar(grupo(true, 7))).toBeNull();
  });

  it('un empleado ocupado con proyecto es válido', () => {
    expect(validar(grupo(false, 7))).toBeNull();
  });

  it('un empleado ocupado sin proyecto da el error del grupo', () => {
    expect(validar(grupo(false, null))).toEqual({ proyectoObligatorio: true });
    expect(validar(grupo(false, undefined))).toEqual({ proyectoObligatorio: true });
    expect(validar(grupo(false, ''))).toEqual({ proyectoObligatorio: true });
  });

  it('el proyecto con id 0 cuenta como proyecto asignado', () => {
    expect(validar(grupo(false, 0))).toBeNull();
  });

  it('el error se marca en el grupo, no en ningún campo', () => {
    const g = grupo(false, null);
    g.setValidators(proyectoObligatorioSiOcupado);
    g.updateValueAndValidity();
    expect(g.errors).toEqual({ proyectoObligatorio: true });
    expect(g.controls.proyectoActualId.errors).toBeNull();
    expect(g.controls.disponible.errors).toBeNull();
  });

  it('se recalcula al cambiar un campo', () => {
    const g = grupo(true, null);
    g.setValidators(proyectoObligatorioSiOcupado);
    g.updateValueAndValidity();
    expect(g.valid).toBeTrue();
    g.controls.disponible.setValue(false);
    expect(g.hasError('proyectoObligatorio')).toBeTrue();
    g.controls.proyectoActualId.setValue(3);
    expect(g.valid).toBeTrue();
  });
});
