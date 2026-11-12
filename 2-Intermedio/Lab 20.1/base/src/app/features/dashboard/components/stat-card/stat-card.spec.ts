import { TestBed } from '@angular/core/testing';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  function crear(titulo: string, valor: number | null) {
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('titulo', titulo);
    fixture.componentRef.setInput('valor', valor);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el título y la cifra', () => {
    const el = crear('Empleados', 10);
    expect(el.querySelector('.stat__titulo')?.textContent).toBe('Empleados');
    expect(el.querySelector('.stat__valor')?.textContent).toBe('10');
  });

  it('muestra el cero como cero', () => {
    expect(crear('Disponibles', 0).querySelector('.stat__valor')?.textContent).toBe('0');
  });

  it('muestra «—» mientras no hay valor', () => {
    expect(crear('Proyectos activos', null).querySelector('.stat__valor')?.textContent).toBe('—');
  });
});
