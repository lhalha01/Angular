import { Injectable, OnDestroy, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/**
 * Avisos al usuario (toasts). Los muestra `<app-notificaciones>`, en la raíz de la aplicación.
 *
 * Un mismo mensaje no se repite mientras siga visible: así los reintentos de una petición que falla (cada
 * intento pasa por el interceptor de errores) dan un solo aviso y no tres.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService implements OnDestroy {
  private readonly _lista = signal<Notificacion[]>([]);
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();
  private siguienteId = 1;

  readonly lista = this._lista.asReadonly();

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje, 8000);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  cerrar(id: number): void {
    clearTimeout(this.temporizadores.get(id));
    this.temporizadores.delete(id);
    this._lista.update((lista) => lista.filter((n) => n.id !== id));
  }

  ngOnDestroy(): void {
    this.temporizadores.forEach((t) => clearTimeout(t));
    this.temporizadores.clear();
  }

  private mostrar(tipo: TipoNotificacion, mensaje: string, duracionMs = 5000): void {
    if (this._lista().some((n) => n.tipo === tipo && n.mensaje === mensaje)) return;
    const id = this.siguienteId++;
    this._lista.update((lista) => [...lista, { id, tipo, mensaje }]);
    this.temporizadores.set(id, setTimeout(() => this.cerrar(id), duracionMs));
  }
}
