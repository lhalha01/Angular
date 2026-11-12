import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ROLES_EMPLEADO, RolEmpleado } from '../../models/empleado.model';
import { EmpleadosFacade } from '../../services/empleados.facade';

type FiltroDisponibilidad = 'todos' | 'disponibles' | 'ocupados';

/** Mínimo de caracteres para buscar en la API; con menos se muestra todo el directorio. */
const MIN_CARACTERES = 2;

/**
 * Directorio de empleados con búsqueda reactiva y filtros combinados. Solo conoce la fachada (`EmpleadosFacade`): ni
 * HTTP ni el estado; lee señales y pide cargar.
 *
 * - **Búsqueda** (`busqueda`): se espera 300 ms a que el usuario deje de teclear (`debounceTime`) y no se repite el
 *   mismo término (`distinctUntilChanged`); la fachada cancela la carga anterior si llega otra (`switchMap`).
 * - **Filtros** por rol y por disponibilidad: se aplican en el cliente (`computed`) sobre lo que hay en el estado.
 * - **Alta de un empleado:** la lista se actualiza sola, porque se lee del estado de la fachada.
 */
@Component({
  selector: 'app-directorio',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="directorio">
      <header class="directorio__cabecera">
        <h1>Directorio de empleados</h1>
        <a class="boton" routerLink="/empleados/nuevo">Dar de alta</a>
      </header>

      <div class="filtros" role="search">
        <label>
          Buscar
          <input
            type="search"
            name="busqueda"
            placeholder="Nombre o email…"
            [value]="busqueda()"
            (input)="busqueda.set(valor($event))"
          />
        </label>
        <label>
          Rol
          <select name="rol" [value]="filtroRol()" (change)="filtroRol.set(rolDe($event))">
            <option value="todos">Todos</option>
            @for (rol of roles; track rol) {
              <option [value]="rol">{{ rol }}</option>
            }
          </select>
        </label>
        <label>
          Disponibilidad
          <select name="disponibilidad" [value]="filtroDisp()" (change)="filtroDisp.set(dispDe($event))">
            <option value="todos">Todos</option>
            <option value="disponibles">Disponibles</option>
            <option value="ocupados">Ocupados</option>
          </select>
        </label>
      </div>

      @if (facade.cargando()) {
        <p role="status">Cargando empleados…</p>
      } @else if (facade.error()) {
        <p role="alert">
          No se pudieron cargar los empleados. ¿Está arrancado el backend (<code>start.cmd</code>)?
        </p>
      } @else {
        <p class="resumen" role="status">
          {{ empleadosFiltrados().length }} de {{ facade.empleados().length }} empleados ·
          {{ facade.disponibles().length }} disponibles
        </p>
        <ul class="lista">
          @for (empleado of empleadosFiltrados(); track empleado.id) {
            <li>
              <a [routerLink]="['/empleados', empleado.id]">{{ empleado.nombre }}</a>
              <span class="email">{{ empleado.email }}</span>
            </li>
          } @empty {
            <li>No se encontraron empleados con los filtros actuales.</li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .directorio { padding: 1.5rem; }
    .directorio__cabecera { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .boton { padding: 0.5rem 1rem; border-radius: 0.5rem; background: #2563eb; color: #fff; text-decoration: none; }
    .filtros { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1rem 0; }
    .filtros label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
    .filtros input, .filtros select { padding: 0.4rem 0.6rem; }
    .resumen { color: #475569; }
    .lista { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .lista li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; }
    .email { color: #475569; }
  `,
})
export class DirectorioEmpleados {
  protected readonly facade = inject(EmpleadosFacade);

  protected readonly roles = ROLES_EMPLEADO;

  /** Lo que el usuario escribe, tecla a tecla. */
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal<RolEmpleado | 'todos'>('todos');
  protected readonly filtroDisp = signal<FiltroDisponibilidad>('todos');

  /**
   * El término que se busca de verdad: recortado, vacío si es demasiado corto (teclear una sola letra no repite la
   * carga), con la pausa de 300 ms y sin repetir el mismo. Empieza vacío: la primera carga no espera.
   */
  private readonly termino = toSignal(
    toObservable(this.busqueda).pipe(
      map((texto) => texto.trim()),
      map((texto) => (texto.length >= MIN_CARACTERES ? texto : '')),
      debounceTime(300),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  /** Lo que se ve: el estado de la fachada con los filtros de rol y de disponibilidad. */
  protected readonly empleadosFiltrados = computed(() => {
    let lista = this.facade.empleados();
    if (this.filtroRol() !== 'todos') lista = lista.filter((e) => e.rol === this.filtroRol());
    if (this.filtroDisp() === 'disponibles') lista = lista.filter((e) => e.disponible);
    if (this.filtroDisp() === 'ocupados') lista = lista.filter((e) => !e.disponible);
    return lista;
  });

  constructor() {
    // Cada vez que cambia el término (también al empezar) se pide la carga a la fachada.
    effect(() => {
      const termino = this.termino();
      untracked(() => this.facade.cargar(termino));
    });
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected rolDe(evento: Event): RolEmpleado | 'todos' {
    return (evento.target as HTMLSelectElement).value as RolEmpleado | 'todos';
  }

  protected dispDe(evento: Event): FiltroDisponibilidad {
    return (evento.target as HTMLSelectElement).value as FiltroDisponibilidad;
  }
}
