import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Resalta el botón de aceptar en rojo (acciones destructivas). */
  danger?: boolean;
}

interface ConfirmRequest {
  options: ConfirmOptions;
  resolve: (accepted: boolean) => void;
}

/**
 * Sustituye a `window.confirm` por un diálogo modal con el estilo de la app.
 * `ask()` devuelve una promesa que se resuelve con la decisión del usuario.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _request = signal<ConfirmRequest | null>(null);
  readonly request = this._request.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    // Si ya había un diálogo abierto, se descarta como "cancelado".
    this._request()?.resolve(false);
    return new Promise<boolean>((resolve) => this._request.set({ options, resolve }));
  }

  answer(accepted: boolean): void {
    const request = this._request();
    if (!request) return;
    this._request.set(null);
    request.resolve(accepted);
  }
}
