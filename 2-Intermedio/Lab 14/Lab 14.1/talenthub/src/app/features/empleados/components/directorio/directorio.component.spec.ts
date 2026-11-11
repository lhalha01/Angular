import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';
import { Empleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';
import { DirectorioEmpleados } from './directorio.component';

const empleado = (id: number, nombre: string): Empleado => ({
  id,
  nombre,
  email: `${nombre.toLowerCase()}@example.com`,
  rol: 'desarrollador',
  habilidades: [],
  disponible: true,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
});

describe('DirectorioEmpleados', () => {
  function crear(getAll: () => Observable<Empleado[]>) {
    TestBed.configureTestingModule({
      imports: [DirectorioEmpleados],
      providers: [provideRouter([]), { provide: EmpleadoService, useValue: { getAll } }],
    });
    const fixture = TestBed.createComponent(DirectorioEmpleados);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra «cargando» mientras llegan los datos y luego la lista con enlaces al perfil', () => {
    const datos = new Subject<Empleado[]>();
    const { fixture, el } = crear(() => datos);
    expect(el.textContent).toContain('Cargando');

    datos.next([empleado(1, 'Ana'), empleado(2, 'Luis')]);
    fixture.detectChanges();

    expect(el.textContent).not.toContain('Cargando');
    const enlaces = Array.from(el.querySelectorAll<HTMLAnchorElement>('.lista a'));
    expect(enlaces.map((a) => a.textContent?.trim())).toEqual(['Ana', 'Luis']);
    expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['/empleados/1', '/empleados/2']);
  });

  it('muestra un aviso si no hay empleados', () => {
    const datos = new Subject<Empleado[]>();
    const { fixture, el } = crear(() => datos);
    datos.next([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('No hay empleados');
  });

  it('muestra un error que menciona el backend si la petición falla', () => {
    const { el } = crear(() => throwError(() => new Error('sin conexión')));
    expect(el.querySelector('[role=alert]')?.textContent).toContain('backend');
  });

  it('enlaza al formulario de alta', () => {
    const datos = new Subject<Empleado[]>();
    const { el } = crear(() => datos);
    expect(el.querySelector<HTMLAnchorElement>('a.boton')?.getAttribute('href')).toBe('/empleados/nuevo');
  });
});
