import { TestBed } from '@angular/core/testing';
import { RolEmpleado } from '@features/empleados';
import { DesglosePorRol } from './desglose-por-rol';

describe('DesglosePorRol', () => {
  const TOTALES: Record<RolEmpleado, number> = { desarrollador: 4, diseñador: 2, qa: 0, devops: 1, manager: 1 };

  function crear(totales: Record<RolEmpleado, number>) {
    const fixture = TestBed.createComponent(DesglosePorRol);
    fixture.componentRef.setInput('totalesPorRol', totales);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra una fila por rol, con su total', () => {
    const { el } = crear(TOTALES);
    const filas = Array.from(el.querySelectorAll('li')).map((li) => li.textContent?.trim());
    expect(filas).toEqual(['desarrollador4', 'diseñador2', 'qa0', 'devops1', 'manager1']);
  });

  it('las barras son proporcionales al rol con más empleados', () => {
    const { el } = crear(TOTALES);
    const anchos = Array.from(el.querySelectorAll<HTMLElement>('.relleno')).map((r) => r.style.width);
    expect(anchos).toEqual(['100%', '50%', '0%', '25%', '25%']);
  });

  it('sin empleados no divide por cero: todas las barras a 0', () => {
    const { el } = crear({ desarrollador: 0, diseñador: 0, qa: 0, devops: 0, manager: 0 });
    expect(Array.from(el.querySelectorAll<HTMLElement>('.relleno')).every((r) => r.style.width === '0%')).toBeTrue();
  });

  it('se actualiza cuando cambian los totales', () => {
    const { fixture, el } = crear(TOTALES);
    fixture.componentRef.setInput('totalesPorRol', { ...TOTALES, qa: 8 });
    fixture.detectChanges();
    expect(el.querySelectorAll('li')[2].textContent).toContain('8');
    expect(el.querySelectorAll<HTMLElement>('.relleno')[2].style.width).toBe('100%');
  });
});
