import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Proyecto, ProyectoService } from '@features/proyectos';
import { Avatar } from '@shared/components/avatar/avatar';
import { BadgeDisponibilidad } from '@shared/components/badge-disponibilidad/badge-disponibilidad';
import { catchError, map, of, switchMap } from 'rxjs';
import { Empleado } from '../../models/empleado.model';

/**
 * Perfil de un empleado (RF-02). Los datos los entrega el resolver (`empleadoResolver`) antes de activar la ruta, así
 * que la pantalla nunca aparece vacía: o hay empleado, o se muestra «no encontrado». Se lee `route.data` como
 * señal (no `snapshot`) para que, si se pasa de `/empleados/1` a `/empleados/2`, el componente se actualice.
 *
 * Muestra las habilidades con su nivel (una etiqueta con color por nivel) y, si el empleado tiene un proyecto asignado, el
 * nombre del proyecto, que se pide a `ProyectoService`; si no se puede obtener, se muestra el identificador.
 */
@Component({
  selector: 'app-perfil',
  imports: [DatePipe, RouterLink, Avatar, BadgeDisponibilidad],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="perfil">
      @let e = empleado();
      @if (e) {
        <header class="perfil__cabecera">
          <app-avatar [nombre]="e.nombre" />
          <h1>{{ e.nombre }}</h1>
          <app-badge-disponibilidad [disponible]="e.disponible" />
        </header>
        <dl>
          <dt>Email</dt>
          <dd>{{ e.email }}</dd>
          <dt>Rol</dt>
          <dd class="rol">{{ e.rol }}</dd>
          <dt>Disponibilidad</dt>
          <dd>{{ e.disponible ? 'Disponible' : 'Ocupado' }}</dd>
          <dt>Incorporación</dt>
          <dd>{{ e.fechaIncorporacion | date: 'dd/MM/yyyy' }}</dd>
          @if (e.proyectoActualId !== null) {
            <dt>Proyecto</dt>
            <dd>
              <a [routerLink]="['/proyectos', e.proyectoActualId]">{{ proyecto()?.nombre ?? 'Proyecto #' + e.proyectoActualId }}</a>
            </dd>
          }
        </dl>

        <h2>Habilidades</h2>
        <ul class="habilidades">
          @for (h of e.habilidades; track h.nombre) {
            <li>
              {{ h.nombre }}
              <span class="nivel nivel--{{ h.nivel }}">{{ h.nivel }}</span>
            </li>
          } @empty {
            <li class="vacio">Sin habilidades registradas.</li>
          }
        </ul>
      } @else {
        <h1>Empleado no encontrado</h1>
        <p>No existe un empleado con ese identificador, o no se pudo cargar.</p>
      }
      <a routerLink="/empleados">← Volver al directorio</a>
    </section>
  `,
  styles: `
    .perfil { padding: 1.5rem; }
    .perfil__cabecera { display: flex; align-items: center; gap: 0.75rem; }
    .perfil__cabecera h1 { margin: 0; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; }
    dt { font-weight: 600; }
    dd { margin: 0; }
    .rol { text-transform: capitalize; }
    .habilidades { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .habilidades li { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 999px; }
    .nivel { padding: 0 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .nivel--junior { background: #e0f2fe; color: #075985; }
    .nivel--mid { background: #fef3c7; color: #92400e; }
    .nivel--senior { background: #dcfce7; color: #166534; }
  `,
})
export class PerfilEmpleado {
  private readonly proyectos = inject(ProyectoService);
  private readonly empleado$ = inject(ActivatedRoute).data.pipe(map((data) => (data['empleado'] ?? null) as Empleado | null));

  protected readonly empleado = toSignal(this.empleado$, { initialValue: null });

  /** El proyecto del empleado (si tiene uno asignado y se puede obtener). */
  protected readonly proyecto = toSignal(
    this.empleado$.pipe(
      switchMap((e) =>
        e?.proyectoActualId == null
          ? of<Proyecto | null>(null)
          : this.proyectos.getById(e.proyectoActualId).pipe(catchError(() => of<Proyecto | null>(null))),
      ),
    ),
    { initialValue: null },
  );
}
