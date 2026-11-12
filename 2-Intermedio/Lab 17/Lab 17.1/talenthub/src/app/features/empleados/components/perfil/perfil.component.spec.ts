import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Empleado } from '../../models/empleado.model';
import { PerfilEmpleado } from './perfil.component';

const ana: Empleado = {
  id: 1,
  nombre: 'Ana',
  email: 'ana@example.com',
  rol: 'qa',
  habilidades: [],
  disponible: false,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
};

describe('PerfilEmpleado', () => {
  function crear(data: Record<string, unknown>) {
    const datos = new BehaviorSubject(data);
    TestBed.configureTestingModule({
      imports: [PerfilEmpleado],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { data: datos } }],
    });
    const fixture = TestBed.createComponent(PerfilEmpleado);
    fixture.detectChanges();
    return { fixture, datos, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra los datos que entrega el resolver', () => {
    const { el } = crear({ empleado: ana });
    expect(el.querySelector('h1')?.textContent).toBe('Ana');
    expect(el.textContent).toContain('ana@example.com');
    expect(el.textContent).toContain('qa');
    expect(el.textContent).toContain('Ocupado');
  });

  it('si el resolver entrega null muestra «no encontrado»', () => {
    const { el } = crear({ empleado: null });
    expect(el.querySelector('h1')?.textContent).toBe('Empleado no encontrado');
  });

  it('si no llega el dato tampoco aparece vacío', () => {
    const { el } = crear({});
    expect(el.querySelector('h1')?.textContent).toBe('Empleado no encontrado');
  });

  it('se actualiza cuando cambian los datos de la ruta (de un empleado a otro)', () => {
    const { fixture, datos, el } = crear({ empleado: ana });
    datos.next({ empleado: { ...ana, nombre: 'Luis', disponible: true } });
    fixture.detectChanges();
    expect(el.querySelector('h1')?.textContent).toBe('Luis');
    expect(el.textContent).toContain('Disponible');
  });

  it('ofrece volver al directorio', () => {
    const { el } = crear({ empleado: ana });
    expect(el.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe('/empleados');
  });
});
