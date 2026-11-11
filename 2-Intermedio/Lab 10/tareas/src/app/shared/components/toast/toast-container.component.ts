import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '@core/services/toast.service';

/** Pinta los avisos activos; `aria-live` hace que los lectores de pantalla los anuncien. */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast">
          <span>{{ toast.message }}</span>
          @if (toast.actionLabel) {
            <button type="button" class="toast__action" (click)="toastService.runAction(toast)">
              {{ toast.actionLabel }}
            </button>
          }
          <button type="button" class="toast__close" aria-label="Cerrar aviso" (click)="toastService.dismiss(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; bottom: 1.25rem; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 0.5rem; z-index: 1000; width: min(92vw, 460px); }
    .toast { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.75rem; background: var(--surface-solid); color: var(--text-strong); border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); }
    .toast span { flex: 1; }
    .toast__action { border: none; background: none; color: var(--accent-text); font-weight: 700; cursor: pointer; text-decoration: underline; }
    .toast__close { border: none; background: none; color: var(--text-dim); cursor: pointer; }
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
