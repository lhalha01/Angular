import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Proyecto, ProyectoService } from '@features/proyectos';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
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

const proyecto = (id: number, nombre: string): Proyecto => ({
  id,
  nombre,
  cliente: 'Acme Corp',
  estado: 'activo',
  fechaInicio: new Date(2026, 0, 1),
  fechaFin: null,
  empleadosIds: [],
});

describe('PerfilEmpleado', () => {
  let getById: jasmine.Spy<(id: number) => Observable<Proyecto | null>>;

  function crear(data: Record<string, unknown>, buscar?: (id: number) => Observable<Proyecto | null>) {
    const datos = new BehaviorSubject(data);
    getById = jasmine.createSpy('getById').and.callFake(buscar ?? ((id: number) => of(proyecto(id, `Proyecto ${id}`))));
    TestBed.configureTestingModule({
      imports: [PerfilEmpleado],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: datos } },
        { provide: ProyectoService, useValue: { getById } },
      ],
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

  describe('habilidades', () => {
    const conHabilidades: Empleado = {
      ...ana,
      habilidades: [
        { nombre: 'Angular', nivel: 'senior' },
        { nombre: 'Docker', nivel: 'junior' },
        { nombre: 'RxJS', nivel: 'mid' },
      ],
    };

    it('las muestra con su nivel, en una etiqueta con la clase del nivel', () => {
      const { el } = crear({ empleado: conHabilidades });
      const filas = Array.from(el.querySelectorAll('.habilidades li')).map((li) => li.textContent?.replace(/\s+/g, ' ').trim());
      expect(filas).toEqual(['Angular senior', 'Docker junior', 'RxJS mid']);
      expect(Array.from(el.querySelectorAll('.nivel')).map((n) => n.className)).toEqual(['nivel nivel--senior', 'nivel nivel--junior', 'nivel nivel--mid']);
    });

    it('sin habilidades lo indica', () => {
      expect(crear({ empleado: ana }).el.textContent).toContain('Sin habilidades registradas');
    });
  });

  describe('proyecto asignado', () => {
    it('muestra el nombre del proyecto, con enlace a su detalle', () => {
      const { el } = crear({ empleado: { ...ana, proyectoActualId: 7 } });
      expect(getById).toHaveBeenCalledOnceWith(7);
      const enlace = Array.from(el.querySelectorAll<HTMLAnchorElement>('dd a')).find((a) => a.getAttribute('href') === '/proyectos/7')!;
      expect(enlace.textContent?.trim()).toBe('Proyecto 7');
    });

    it('sin proyecto no muestra la fila ni lo pide', () => {
      const { el } = crear({ empleado: ana });
      expect(getById).not.toHaveBeenCalled();
      expect(el.querySelector('dl')?.textContent).not.toContain('Proyecto');
    });

    it('si el proyecto no se puede obtener muestra su identificador', () => {
      const { el } = crear({ empleado: { ...ana, proyectoActualId: 9 } }, () => throwError(() => new Error('500')));
      expect(el.textContent).toContain('Proyecto #9');
    });

    it('al pasar a otro empleado, pide su proyecto', () => {
      const { fixture, datos } = crear({ empleado: { ...ana, proyectoActualId: 7 } });
      datos.next({ empleado: { ...ana, id: 2, proyectoActualId: 8 } });
      fixture.detectChanges();
      expect(getById).toHaveBeenCalledWith(8);
    });
  });

  it('muestra el avatar, la disponibilidad y la fecha de incorporación', () => {
    const { el } = crear({ empleado: ana });
    expect(el.querySelector('app-avatar')).not.toBeNull();
    expect(el.querySelector('app-badge-disponibilidad')?.textContent).toContain('Ocupado');
    expect(el.textContent).toContain('01/01/2026');
  });

  it('ofrece volver al directorio', () => {
    const { el } = crear({ empleado: ana });
    const volver = Array.from(el.querySelectorAll<HTMLAnchorElement>('a')).find((a) => a.textContent?.includes('Volver'));
    expect(volver?.getAttribute('href')).toBe('/empleados');
  });
});
