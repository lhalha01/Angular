import { FormControl, FormGroup } from '@angular/forms';
import { dateRange } from './date-range.validator';

describe('dateRange (validador cruzado de fechas)', () => {
  const grupo = (start: unknown, end: unknown) =>
    new FormGroup({ startDate: new FormControl(start), endDate: new FormControl(end) });
  const validar = (start: unknown, end: unknown) => dateRange('startDate', 'endDate')(grupo(start, end));

  it('acepta un fin posterior al inicio', () => {
    expect(validar('2026-03-01', '2026-03-05')).toBeNull();
  });

  it('acepta el mismo día', () => {
    expect(validar('2026-03-05', '2026-03-05')).toBeNull();
  });

  it('rechaza un fin anterior al inicio', () => {
    expect(validar('2026-03-05', '2026-03-01')).toEqual({ endBeforeStart: true });
    expect(validar('2026-12-31', '2026-01-01')).toEqual({ endBeforeStart: true });
  });

  it('acepta si alguna de las dos fechas está vacía o falta', () => {
    expect(validar('', '2026-03-01')).toBeNull();
    expect(validar('2026-03-01', '')).toBeNull();
    expect(validar('', '')).toBeNull();
    expect(validar(null, '2026-03-01')).toBeNull();
    expect(validar(undefined, undefined)).toBeNull();
  });

  it('no compara lo que no se puede leer como fecha', () => {
    expect(validar('mañana', '2026-03-01')).toBeNull();
    expect(validar('2026-03-01', 'pasado')).toBeNull();
  });

  it('funciona con otros nombres de campo', () => {
    const g = new FormGroup({ desde: new FormControl('2026-03-09'), hasta: new FormControl('2026-03-01') });
    expect(dateRange('desde', 'hasta')(g)).toEqual({ endBeforeStart: true });
    expect(dateRange('hasta', 'desde')(g)).toBeNull();
  });

  it('el error se marca en el grupo y se recalcula al cambiar una fecha', () => {
    const g = grupo('2026-03-05', '2026-03-01');
    g.setValidators(dateRange('startDate', 'endDate'));
    g.updateValueAndValidity();
    expect(g.errors).toEqual({ endBeforeStart: true });
    expect(g.controls.startDate.errors).toBeNull();
    expect(g.controls.endDate.errors).toBeNull();
    g.controls.endDate.setValue('2026-03-09');
    expect(g.valid).toBeTrue();
  });
});
