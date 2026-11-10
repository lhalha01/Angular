import { Component, inject } from '@angular/core';
import { Notifier } from '../../services/notification';

/** Muestra las notificaciones activas en la esquina de la pantalla. */
@Component({
  selector: 'app-toast',
  template: `
    <div class="toasts" aria-live="polite">
      @for (n of notifications.items(); track n.id) {
        <div class="toast" [class.toast-error]="n.type === 'error'" role="status">
          <span>{{ n.text }}</span>
          <button type="button" class="toast-close" aria-label="Cerrar" (click)="notifications.dismiss(n.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 1000;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: space-between;
      min-width: 260px;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: #198754;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .toast-error { background: #dc3545; }
    .toast-close {
      border: none;
      background: transparent;
      color: inherit;
      font-size: 1.25rem;
      cursor: pointer;
    }
  `,
})
export class Toast {
  protected readonly notifications = inject(Notifier);
}
