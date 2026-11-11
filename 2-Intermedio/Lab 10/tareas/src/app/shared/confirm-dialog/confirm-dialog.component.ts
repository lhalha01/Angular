import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

/**
 * Diálogo modal basado en el elemento nativo <dialog>: el navegador se encarga de atrapar
 * el foco, de bloquear el resto de la página y de cerrar con Escape.
 * El primer botón (Cancelar) recibe el foco inicial, para no confirmar por accidente.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let req = request();
    <dialog
      #dialog
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      (cancel)="onEscape($event)"
    >
      <div class="box">
        <h2 id="confirm-title">{{ req?.options?.title }}</h2>
        <p id="confirm-message">{{ req?.options?.message }}</p>
        <div class="actions">
          <button type="button" class="btn btn-secondary" (click)="answer(false)">
            {{ req?.options?.cancelLabel ?? 'Cancelar' }}
          </button>
          <button
            type="button"
            class="btn"
            [class.btn-primary]="!req?.options?.danger"
            [class.btn-danger-solid]="req?.options?.danger"
            (click)="answer(true)"
          >
            {{ req?.options?.confirmLabel ?? 'Aceptar' }}
          </button>
        </div>
      </div>
    </dialog>
  `,
  styles: `
    dialog { padding: 0; border: 1px solid var(--border); border-radius: 1rem; background: var(--surface-solid); color: var(--text); width: min(92vw, 420px); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4); }
    dialog::backdrop { background: rgba(2, 8, 23, 0.6); }
    .box { padding: 1.5rem; }
    h2 { margin: 0 0 0.75rem; font-size: 1.25rem; }
    p { margin: 0; color: var(--text-muted); line-height: 1.5; }
    .actions { justify-content: flex-end; margin-top: 1.5rem; }
    .btn-danger-solid { background: #dc2626; color: white; }
  `,
})
export class ConfirmDialogComponent {
  private readonly confirm = inject(ConfirmService);
  protected readonly request = this.confirm.request;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    // El clic sobre el fondo es un atajo de ratón: el equivalente de teclado ya existe (Escape,
    // `onEscape`). Se registra con un listener nativo en lugar de `(click)` en la plantilla porque
    // el <dialog> no es un control interactivo y las reglas de accesibilidad lo señalarían.
    afterNextRender(() => {
      this.dialog().nativeElement.addEventListener('click', (event) => this.onBackdropClick(event));
    });
    effect(() => {
      const open = this.request() !== null;
      const el = this.dialog().nativeElement;
      if (open && !el.open) el.showModal();
      else if (!open && el.open) el.close();
    });
  }

  protected answer(accepted: boolean): void {
    this.confirm.answer(accepted);
  }

  /** Escape: se trata como "cancelar" (y evitamos que el navegador cierre por su cuenta). */
  protected onEscape(event: Event): void {
    event.preventDefault();
    this.confirm.answer(false);
  }

  /** Un clic fuera de la caja (sobre el fondo oscurecido) también cancela. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.confirm.answer(false);
  }
}
