import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConCambiosPendientes } from '@core/guards/cambios-pendientes.guard';

/**
 * Formulario de alta de empleado: de momento solo la estructura mínima que necesita el router. Su
 * contenido real (Reactive Forms, validadores y envío) llega en el Lab 16, y el alta en el servidor, en
 * los Labs 14 y 17. Lo que sí hace ya es avisar de los cambios sin guardar, que lee `cambiosPendientesGuard`
 * a través de `tieneCambiosPendientes()`.
 */
@Component({
  selector: 'app-formulario-alta',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alta">
      <h1>Alta de empleado</h1>
      <p class="aviso">El guardado del alta se implementa en los laboratorios 14, 16 y 17.</p>

      <label>
        Nombre
        <input name="nombre" [value]="nombre()" (input)="nombre.set(valor($event))" />
      </label>
      <label>
        Email
        <input name="email" type="email" [value]="email()" (input)="email.set(valor($event))" />
      </label>

      <a routerLink="/empleados">Cancelar</a>
    </section>
  `,
  styles: `
    .alta { padding: 1.5rem; display: grid; gap: 0.75rem; max-width: 28rem; }
    label { display: grid; gap: 0.25rem; }
    .aviso { color: #475569; }
  `,
})
export class FormularioAlta implements ConCambiosPendientes {
  protected readonly nombre = signal('');
  protected readonly email = signal('');

  private readonly sucio = computed(() => this.nombre().trim() !== '' || this.email().trim() !== '');

  tieneCambiosPendientes(): boolean {
    return this.sucio();
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
