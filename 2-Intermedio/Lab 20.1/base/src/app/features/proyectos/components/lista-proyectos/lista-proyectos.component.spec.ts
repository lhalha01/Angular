import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Proyecto } from '../../models/proyecto.model';
import { ProyectoService } from '../../services/proyecto.service';
import { ListaProyectos } from './lista-proyectos.component';

const proyecto = (id: number, nombre: string, estado: Proyecto['estado'] = 'activo', equipo = 1): Proyecto => ({
  id,
  nombre,
  cliente: 'Cliente 1',
  estado,
  fechaInicio: new Date(2026, 0, 1),
  fechaFin: null,
  empleadosIds: Array.from({ length: equipo }, (_, i) => i + 1),
});

describe('ListaProyectos', () => {
  function crear(getAll: () => Observable<Proyecto[]>) {
    TestBed.configureTestingModule({
      imports: [ListaProyectos],
      providers: [provideRouter([]), { provide: ProyectoService, useValue: { getAll } }],
    });
    const fixture = TestBed.createComponent(ListaProyectos);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra «cargando» y luego los proyectos con su estado', () => {
    const datos = new Subject<Proyecto[]>();
    const { fixture, el } = crear(() => datos);
    expect(el.textContent).toContain('Cargando');

    datos.next([proyecto(1, 'Migración', 'activo'), proyecto(2, 'Rediseño', 'completado')]);
    fixture.detectChanges();

    expect(el.textContent).not.toContain('Cargando');
    expect(Array.from(el.querySelectorAll('.nombre')).map((n) => n.textContent)).toEqual(['Migración', 'Rediseño']);
    expect(Array.from(el.querySelectorAll('li .estado')).map((n) => n.textContent)).toEqual(['activo', 'completado']);
  });

  it('muestra el cliente y el número de empleados de cada proyecto, con enlace a su detalle', () => {
    const { el } = crear(() => of([proyecto(7, 'Migración', 'activo', 3), proyecto(8, 'Rediseño', 'activo', 1)]));
    expect(Array.from(el.querySelectorAll('.cliente')).map((c) => c.textContent)).toEqual(['Cliente 1', 'Cliente 1']);
    expect(Array.from(el.querySelectorAll('.empleados')).map((c) => c.textContent?.trim())).toEqual(['3 empleados', '1 empleado']);
    expect(Array.from(el.querySelectorAll<HTMLAnchorElement>('.nombre')).map((a) => a.getAttribute('href'))).toEqual(['/proyectos/7', '/proyectos/8']);
  });

  describe('filtro por estado', () => {
    const datos = [proyecto(1, 'Uno', 'activo'), proyecto(2, 'Dos', 'pausado'), proyecto(3, 'Tres', 'completado'), proyecto(4, 'Cuatro', 'activo')];
    const nombres = (el: HTMLElement) => Array.from(el.querySelectorAll('.nombre')).map((n) => n.textContent);
    const elegir = (fixture: { detectChanges(): void }, el: HTMLElement, valor: string) => {
      const select = el.querySelector<HTMLSelectElement>('select[name=estado]')!;
      select.value = valor;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };

    it('ofrece los tres estados', () => {
      const { el } = crear(() => of(datos));
      const valores = Array.from(el.querySelectorAll<HTMLOptionElement>('select[name=estado] option')).map((o) => o.value);
      expect(valores).toEqual(['todos', 'activo', 'pausado', 'completado']);
    });

    it('filtra por cada estado y vuelve a mostrar todos', () => {
      const { fixture, el } = crear(() => of(datos));
      expect(nombres(el)).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro']);
      elegir(fixture, el, 'activo');
      expect(nombres(el)).toEqual(['Uno', 'Cuatro']);
      elegir(fixture, el, 'pausado');
      expect(nombres(el)).toEqual(['Dos']);
      elegir(fixture, el, 'completado');
      expect(nombres(el)).toEqual(['Tres']);
      elegir(fixture, el, 'todos');
      expect(nombres(el).length).toBe(4);
    });

    it('el resumen dice cuántos se ven de cuántos', () => {
      const { fixture, el } = crear(() => of(datos));
      elegir(fixture, el, 'activo');
      expect(el.querySelector('.resumen')?.textContent).toContain('2 de 4 proyectos');
    });

    it('si ninguno tiene ese estado lo indica', () => {
      const { fixture, el } = crear(() => of([proyecto(1, 'Uno', 'activo')]));
      elegir(fixture, el, 'pausado');
      expect(el.textContent).toContain('No hay proyectos en estado «pausado»');
    });
  });

  it('muestra un aviso si no hay proyectos', () => {
    const datos = new Subject<Proyecto[]>();
    const { fixture, el } = crear(() => datos);
    datos.next([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('No hay proyectos');
  });

  it('si falla indica que no hay datos (el aviso del error lo muestra el interceptor)', () => {
    const { el } = crear(() => throwError(() => new Error('sin conexión')));
    expect(el.textContent).toContain('No se pudieron cargar los proyectos');
  });
});
