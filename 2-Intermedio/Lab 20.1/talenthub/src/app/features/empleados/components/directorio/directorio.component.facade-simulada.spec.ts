import { computed, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Empleado } from '../../models/empleado.model';
import { EmpleadosFacade } from '../../services/empleados.facade';
import { DirectorioEmpleados } from './directorio.component';

const ANA: Empleado = {
  id: 1,
  nombre: 'Ana',
  email: 'ana@example.com',
  rol: 'desarrollador',
  habilidades: [],
  disponible: true,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
};

/**
 * El directorio aislado: la fachada se sustituye por un doble con señales que el test controla, de modo que se prueba
 * solo lo que hace el componente con ella (leer sus señales y pedir `cargar`), sin servicio HTTP ni estado reales.
 * (El otro archivo de pruebas, `directorio.component.spec.ts`, lo prueba con la fachada y el estado reales.)
 */
describe('DirectorioEmpleados con la fachada simulada', () => {
  let empleados: WritableSignal<Empleado[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let cargar: jasmine.Spy;
  let fixture: ComponentFixture<DirectorioEmpleados>;
  let el: HTMLElement;

  beforeEach(async () => {
    empleados = signal([ANA]);
    cargando = signal(false);
    error = signal<string | null>(null);
    cargar = jasmine.createSpy('cargar');
    const facade = {
      empleados: empleados.asReadonly(),
      cargando: cargando.asReadonly(),
      error: error.asReadonly(),
      disponibles: computed(() => empleados().filter((e) => e.disponible)),
      cargar,
    };
    await TestBed.configureTestingModule({
      imports: [DirectorioEmpleados],
      providers: [provideRouter([]), { provide: EmpleadosFacade, useValue: facade }],
    }).compileComponents();
    fixture = TestBed.createComponent(DirectorioEmpleados);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('muestra los empleados que da la fachada', () => {
    expect(el.textContent).toContain('Ana');
    expect(el.querySelectorAll('.lista a').length).toBe(1);
  });

  it('llama a cargar() una vez al inicializarse, pidiendo la lista completa', () => {
    expect(cargar).toHaveBeenCalledTimes(1);
    expect(cargar).toHaveBeenCalledWith('');
  });

  it('se actualiza cuando cambia la señal de la fachada (por ejemplo, un alta)', () => {
    empleados.set([ANA, { ...ANA, id: 2, nombre: 'Marta', disponible: false }]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Marta');
    expect(el.querySelector('.resumen')?.textContent?.replace(/\s+/g, ' ')).toContain('2 de 2 empleados · 1 disponibles');
    expect(cargar).toHaveBeenCalledTimes(1); // no se vuelve a cargar
  });

  it('muestra «Cargando» mientras la fachada está cargando', () => {
    cargando.set(true);
    fixture.detectChanges();
    expect(el.textContent).toContain('Cargando');
  });

  it('muestra el error de la fachada', () => {
    error.set('No se pudieron cargar los empleados.');
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')).not.toBeNull();
  });
});
