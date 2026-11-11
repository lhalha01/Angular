import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Empleado } from '../../models/empleado.model';

/**
 * Perfil de un empleado. Los datos los entrega el resolver (`empleadoResolver`) antes de activar la ruta, así
 * que la pantalla nunca aparece vacía: o hay empleado, o se muestra «no encontrado». Se lee `route.data` como
 * señal (no `snapshot`) para que, si se pasa de `/empleados/1` a `/empleados/2`, el componente se actualice.
 */
@Component({
  selector: 'app-perfil',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="perfil">
      @let e = empleado();
      @if (e) {
        <h1>{{ e.nombre }}</h1>
        <dl>
          <dt>Email</dt>
          <dd>{{ e.email }}</dd>
          <dt>Rol</dt>
          <dd>{{ e.rol }}</dd>
          <dt>Disponibilidad</dt>
          <dd>{{ e.disponible ? 'Disponible' : 'Ocupado' }}</dd>
        </dl>
      } @else {
        <h1>Empleado no encontrado</h1>
        <p>No existe un empleado con ese identificador, o no se pudo cargar.</p>
      }
      <a routerLink="/empleados">← Volver al directorio</a>
    </section>
  `,
  styles: `
    .perfil { padding: 1.5rem; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; }
    dt { font-weight: 600; }
    dd { margin: 0; }
  `,
})
export class PerfilEmpleado {
  protected readonly empleado = toSignal(
    inject(ActivatedRoute).data.pipe(map((data) => (data['empleado'] ?? null) as Empleado | null)),
    { initialValue: null },
  );
}
