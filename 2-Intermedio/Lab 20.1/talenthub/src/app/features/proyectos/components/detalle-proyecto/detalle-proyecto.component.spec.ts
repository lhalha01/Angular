import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { MiembroEquipo, Proyecto } from '../../models/proyecto.model';
import { ProyectoService } from '../../services/proyecto.service';
import { DetalleProyecto } from './detalle-proyecto.component';

const proyecto = (id: number, empleadosIds: number[], estado: Proyecto['estado'] = 'activo', fechaFin: Date | null = null): Proyecto => ({
  id,
  nombre: `Proyecto ${id}`,
  cliente: 'Acme Corp',
  estado,
  fechaInicio: new Date(2026, 2, 5),
  fechaFin,
  empleadosIds,
});

describe('DetalleProyecto', () => {
  let getEquipo: jasmine.Spy<(proyectoId: number) => Observable<MiembroEquipo[]>>;
  /** Los equipos por proyecto que devuelve el doble del servicio. */
  const equipos: Record<number, number[]> = { 3: [1, 5], 4: [2, 3] };

  function crear(data: Record<string, unknown>, equipo?: (proyectoId: number) => Observable<MiembroEquipo[]>) {
    const datos = new BehaviorSubject(data);
    getEquipo = jasmine
      .createSpy('getEquipo')
      .and.callFake(equipo ?? ((id: number) => of((equipos[id] ?? []).map((m): MiembroEquipo => ({ id: m, nombre: `Persona ${m}` })))));
    TestBed.configureTestingModule({
      imports: [DetalleProyecto],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { data: datos } }, { provide: ProyectoService, useValue: { getEquipo } }],
    });
    const fixture = TestBed.createComponent(DetalleProyecto);
    fixture.detectChanges();
    return { fixture, datos, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra los datos del proyecto que entrega el resolver', () => {
    const { el } = crear({ proyecto: proyecto(3, []) });
    expect(el.querySelector('h1')?.textContent).toBe('Proyecto 3');
    expect(el.textContent).toContain('Acme Corp');
    expect(el.querySelector('.estado')?.textContent).toBe('activo');
    expect(el.textContent).toContain('05/03/2026');
    expect(el.textContent).toContain('Sin fecha de fin');
  });

  it('un proyecto terminado muestra su fecha de fin', () => {
    const { el } = crear({ proyecto: proyecto(3, [], 'completado', new Date(2026, 5, 30)) });
    expect(el.textContent).toContain('30/06/2026');
    expect(el.textContent).not.toContain('Sin fecha de fin');
  });

  it('muestra el equipo con su avatar y un enlace al perfil de cada persona', () => {
    const { el } = crear({ proyecto: proyecto(3, [1, 5]) });
    expect(getEquipo).toHaveBeenCalledOnceWith(3);
    expect(el.querySelector('h2')?.textContent).toContain('Equipo (2)');
    expect(Array.from(el.querySelectorAll<HTMLAnchorElement>('.equipo a')).map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Persona 1', '/empleados/1'],
      ['Persona 5', '/empleados/5'],
    ]);
    expect(el.querySelectorAll('.equipo app-avatar').length).toBe(2);
  });

  it('muestra «cargando» mientras llega el equipo', () => {
    const equipo = new Subject<MiembroEquipo[]>();
    const { fixture, el } = crear({ proyecto: proyecto(3, [1]) }, () => equipo);
    expect(el.textContent).toContain('Cargando el equipo');
    equipo.next([{ id: 1, nombre: 'Ana' }]);
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Cargando el equipo');
    expect(el.querySelector('.equipo a')?.textContent).toBe('Ana');
  });

  it('un proyecto sin equipo lo indica y no pide nada al servidor', () => {
    const { el } = crear({ proyecto: proyecto(3, []) });
    expect(el.textContent).toContain('Este proyecto no tiene empleados asignados');
    expect(getEquipo).not.toHaveBeenCalled();
  });

  it('si falla la carga del equipo lo indica (el aviso lo da el interceptor)', () => {
    const { el } = crear({ proyecto: proyecto(3, [1]) }, () => throwError(() => new Error('500')));
    expect(el.querySelector('[role=alert]')?.textContent).toContain('No se pudo cargar el equipo');
  });

  it('si el resolver entrega null (o nada) muestra «no encontrado» y no pide el equipo', () => {
    expect(crear({ proyecto: null }).el.querySelector('h1')?.textContent).toBe('Proyecto no encontrado');
    TestBed.resetTestingModule();
    expect(crear({}).el.querySelector('h1')?.textContent).toBe('Proyecto no encontrado');
    expect(getEquipo).not.toHaveBeenCalled();
  });

  it('se actualiza al pasar de un proyecto a otro, y pide su equipo', () => {
    const { fixture, datos, el } = crear({ proyecto: proyecto(3, [1]) });
    datos.next({ proyecto: proyecto(4, [2, 3]) });
    fixture.detectChanges();
    expect(el.querySelector('h1')?.textContent).toBe('Proyecto 4');
    expect(getEquipo).toHaveBeenCalledWith(4);
    expect(el.querySelectorAll('.equipo li').length).toBe(2);
  });

  it('ofrece volver a la lista de proyectos', () => {
    const { el } = crear({ proyecto: proyecto(3, []) });
    const volver = Array.from(el.querySelectorAll<HTMLAnchorElement>('a')).find((a) => a.textContent?.includes('Volver'));
    expect(volver?.getAttribute('href')).toBe('/proyectos');
  });
});
