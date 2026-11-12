import { TestBed } from '@angular/core/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { Proyecto } from '../../models/proyecto.model';
import { ProyectoService } from '../../services/proyecto.service';
import { ListaProyectos } from './lista-proyectos.component';

const proyecto = (id: number, nombre: string, estado: Proyecto['estado'] = 'activo'): Proyecto => ({
  id,
  nombre,
  cliente: 'Cliente 1',
  estado,
  fechaInicio: new Date(2026, 0, 1),
  fechaFin: null,
  empleadosIds: [1],
});

describe('ListaProyectos', () => {
  function crear(getAll: () => Observable<Proyecto[]>) {
    TestBed.configureTestingModule({
      imports: [ListaProyectos],
      providers: [{ provide: ProyectoService, useValue: { getAll } }],
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
    expect(Array.from(el.querySelectorAll('.estado')).map((n) => n.textContent)).toEqual(['activo', 'completado']);
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
