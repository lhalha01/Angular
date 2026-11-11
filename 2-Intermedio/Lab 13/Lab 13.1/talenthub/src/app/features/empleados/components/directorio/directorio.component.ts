import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Empleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; empleados: Empleado[] };

/**
 * Directorio de empleados: lista simple con enlace al perfil de cada uno. La búsqueda y los filtros reactivos
 * llegan en el Lab 15; aquí basta para recorrer la navegación del router (lista, perfil y alta).
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
          <ul class="lista">
            @for (empleado of empleados(); track empleado.id) {
              <li>
                <a [routerLink]="['/empleados', empleado.id]">{{ empleado.nombre }}</a>
                <span class="email">{{ empleado.email }}</span>
              </li>
            } @empty {
              <li>No hay empleados.</li>
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
    .lista { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .lista li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; }
    .email { color: #475569; }
  `,
})
export class DirectorioEmpleados {
  private readonly servicio = inject(EmpleadoService);

  protected readonly estado = toSignal(
    this.servicio.getAll().pipe(
      map((empleados): Estado => ({ tipo: 'ok', empleados })),
      catchError(() => of<Estado>({ tipo: 'error' })),
    ),
    { initialValue: { tipo: 'cargando' } as Estado },
  );

  protected empleados(): Empleado[] {
    const estado = this.estado();
    return estado.tipo === 'ok' ? estado.empleados : [];
  }
}
