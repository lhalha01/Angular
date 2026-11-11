import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Tarjeta centrada para estados de pantalla (cargando, error, vacío, no encontrado).
 * El contenido se proyecta, así que puede llevar enlaces o botones de acción.
 * Los lectores de pantalla lo anuncian: `alert` si es un error, `status` en el resto.
 */
@Component({
  selector: 'app-state-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="card state" [attr.role]="kind() === 'error' ? 'alert' : 'status'"><ng-content /></div>`,
})
export class StateMessageComponent {
  readonly kind = input<'info' | 'error'>('info');
}
