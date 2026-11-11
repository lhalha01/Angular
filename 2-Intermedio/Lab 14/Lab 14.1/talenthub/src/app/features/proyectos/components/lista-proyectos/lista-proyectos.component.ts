import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { Proyecto } from '../../models/proyecto.model';
import { ProyectoService } from '../../services/proyecto.service';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; proyectos: Proyecto[] };

/**
 * Listado de proyectos, leído de la API a través de `ProyectoService`. El aviso del error lo muestra el interceptor;
 * aquí solo se indica que no hay datos. Las tarjetas y el equipo de cada proyecto llegan en laboratorios posteriores.
 */
@Component({
  selector: 'app-lista-proyectos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="proyectos">
      <h1>Proyectos</h1>

      @switch (estado().tipo) {
        @case ('cargando') {
          <p role="status">Cargando proyectos…</p>
        }
        @case ('error') {
          <p>No se pudieron cargar los proyectos.</p>
        }
        @default {
          <ul class="lista">
            @for (proyecto of proyectos(); track proyecto.id) {
              <li>
                <span class="nombre">{{ proyecto.nombre }}</span>
                <span class="estado estado--{{ proyecto.estado }}">{{ proyecto.estado }}</span>
              </li>
            } @empty {
              <li>No hay proyectos.</li>
            }
          </ul>
        }
      }
    </section>
  `,
  styles: `
    .proyectos { padding: 1.5rem; }
    .lista { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .lista li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; }
    .estado { padding: 0.1rem 0.6rem; border-radius: 999px; font-size: 0.85rem; background: #e2e8f0; }
    .estado--activo { background: #dbeafe; }
    .estado--completado { background: #dcfce7; }
  `,
})
export class ListaProyectos {
  private readonly servicio = inject(ProyectoService);

  protected readonly estado = toSignal(
    this.servicio.getAll().pipe(
      map((proyectos): Estado => ({ tipo: 'ok', proyectos })),
      catchError(() => of<Estado>({ tipo: 'error' })),
    ),
    { initialValue: { tipo: 'cargando' } as Estado },
  );

  protected proyectos(): Proyecto[] {
    const estado = this.estado();
    return estado.tipo === 'ok' ? estado.proyectos : [];
  }
}
