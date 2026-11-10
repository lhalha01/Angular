import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error';

export interface AppNotification {
  id: number;
  text: string;
  type: NotificationType;
}

/** Notificaciones tipo "toast" que se descartan solas pasados unos segundos. */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly _items = signal<AppNotification[]>([]);
  readonly items = this._items.asReadonly();
  private counter = 0;

  show(text: string, type: NotificationType = 'success', durationMs = 3500): void {
    const id = ++this.counter;
    this._items.update((list) => [...list, { id, text, type }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this._items.update((list) => list.filter((n) => n.id !== id));
  }
}
