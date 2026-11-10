import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  /** Acción opcional (p. ej. "Deshacer"). */
  actionLabel?: string;
  action?: () => void;
}

export interface ToastOptions {
  actionLabel?: string;
  action?: () => void;
  /** Milisegundos hasta que se oculta solo. */
  duration?: number;
}

/** Avisos breves ("toasts") para confirmar acciones del usuario. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  show(message: string, options: ToastOptions = {}): void {
    const toast: Toast = { id: this.nextId++, message, actionLabel: options.actionLabel, action: options.action };
    this._toasts.update((list) => [...list, toast]);
    this.timers.set(toast.id, setTimeout(() => this.dismiss(toast.id), options.duration ?? 5000));
  }

  /** Ejecuta la acción del aviso (si la tiene) y lo cierra. */
  runAction(toast: Toast): void {
    toast.action?.();
    this.dismiss(toast.id);
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
