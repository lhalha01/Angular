import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificacionService } from '@core/services/notificacion.service';

/** Zona de avisos de la aplicación: pinta las notificaciones de `NotificacionService`. */
@Component({
  selector: 'app-notificaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notificaciones" aria-live="polite">
      @for (n of servicio.lista(); track n.id) {
        <div class="aviso aviso--{{ n.tipo }}" [attr.role]="n.tipo === 'error' ? 'alert' : 'status'">
          <span>{{ n.mensaje }}</span>
          <button type="button" aria-label="Cerrar aviso" (click)="servicio.cerrar(n.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: `
    .notificaciones { position: fixed; right: 1rem; bottom: 1rem; display: grid; gap: 0.5rem; width: min(26rem, calc(100vw - 2rem)); z-index: 1000; }
    .aviso { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.5rem; color: #fff; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .aviso--exito { background: #15803d; }
    .aviso--error { background: #b91c1c; }
    .aviso--info { background: #1d4ed8; }
    button { background: transparent; border: 0; color: inherit; cursor: pointer; font-size: 1rem; line-height: 1; }
  `,
})
export class Notificaciones {
  protected readonly servicio = inject(NotificacionService);
}
