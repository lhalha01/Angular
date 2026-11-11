import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { Empleado, ROLES_EMPLEADO, RolEmpleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; empleados: Empleado[] };
type FiltroDisponibilidad = 'todos' | 'disponibles' | 'ocupados';

/** Mínimo de caracteres para buscar en la API; con menos se muestra todo el directorio. */
const MIN_CARACTERES = 2;

/**
 * Directorio de empleados con búsqueda reactiva y filtros combinados.
 *
 * - **Búsqueda** (`busqueda`): se espera 300 ms a que el usuario deje de teclear (`debounceTime`), no se repite la
 *   misma búsqueda (`distinctUntilChanged`) y, si llega otra mientras la anterior está en vuelo, se cancela la
 *   anterior (`switchMap`). Busca la API (`/users?q=`).
 * - **Filtros** por rol y por disponibilidad: se aplican en el cliente sobre lo que ha devuelto la búsqueda
 *   (`computed`), porque la API no los ofrece; se combinan con la búsqueda.
 *
 * No hay suscripciones manuales: el flujo se convierte en señal con `toSignal`, que se cancela al destruir el componente.
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

      @switch (estado().tipo) {
        @case ('cargando') {
          <p role="status">Cargando empleados…</p>
        }
        @case ('error') {
          <p role="alert">
            No se pudieron cargar los empleados. ¿Está arrancado el backend (<code>start.cmd</code>)?
          </p>
        }
        @default {
          <p class="resumen" role="status">
            {{ empleadosFiltrados().length }} de {{ empleados().length }} empleados · {{ totalDisponibles() }} disponibles
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
  private readonly servicio = inject(EmpleadoService);

  protected readonly roles = ROLES_EMPLEADO;

  /** Lo que el usuario escribe, tecla a tecla. */
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal<RolEmpleado | 'todos'>('todos');
  protected readonly filtroDisp = signal<FiltroDisponibilidad>('todos');

  /**
   * El estado de la carga, que se recalcula con cada búsqueda. Un término de menos de 2 caracteres equivale a no
   * buscar (cadena vacía): así teclear una sola letra no repite la carga del directorio completo.
   */
  protected readonly estado = toSignal(
    toObservable(this.busqueda).pipe(
      map((texto) => texto.trim()),
      map((texto) => (texto.length >= MIN_CARACTERES ? texto : '')),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((termino) =>
        this.servicio.getAll(termino).pipe(
          map((empleados): Estado => ({ tipo: 'ok', empleados })),
          catchError(() => of<Estado>({ tipo: 'error' })), // el aviso lo da el interceptor de errores
          startWith<Estado>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as Estado },
  );

  /** Lo que ha devuelto la búsqueda. */
  protected readonly empleados = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'ok' ? estado.empleados : [];
  });

  /** Lo que se ve: el resultado de la búsqueda con los filtros de rol y de disponibilidad. */
  protected readonly empleadosFiltrados = computed(() => {
    let lista = this.empleados();
    if (this.filtroRol() !== 'todos') lista = lista.filter((e) => e.rol === this.filtroRol());
    if (this.filtroDisp() === 'disponibles') lista = lista.filter((e) => e.disponible);
    if (this.filtroDisp() === 'ocupados') lista = lista.filter((e) => !e.disponible);
    return lista;
  });

  protected readonly totalDisponibles = computed(() => this.empleados().filter((e) => e.disponible).length);

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
