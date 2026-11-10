import { HttpClient } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ignoreServerOutcome } from './ignore-server-outcome';

export type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Base para recursos REST cuyo estado vive en memoria (la API es de mentira y no guarda
 * cambios). Aporta la carga inicial, el estado como `signal`, la búsqueda por id y las
 * operaciones de añadir, actualizar, borrar y restaurar. Cada servicio concreto (tareas,
 * usuarios) solo añade su vocabulario y sus reglas.
 *
 * Las subclases llaman a `this.reload()` al final de su constructor.
 */
export abstract class InMemoryResource<T extends { id: number }> {
  protected readonly http = inject(HttpClient);
  /** URL de la colección, p. ej. `https://…/todos`. */
  protected abstract readonly apiUrl: string;

  private readonly _items = signal<T[]>([]);
  private readonly _status = signal<LoadStatus>('loading');

  readonly items = this._items.asReadonly();
  readonly status = this._status.asReadonly();

  /** Carga (o recarga) la colección desde la API, descartando lo que hubiera en memoria. */
  reload(): void {
    this._status.set('loading');
    this.http.get<T[]>(this.apiUrl).subscribe({
      next: (items) => {
        this._items.set(this.prepare(items));
        this._status.set('ready');
      },
      error: () => this._status.set('error'),
    });
  }

  /** Gancho para completar los datos recién cargados (p. ej. campos que la API no trae). */
  protected prepare(items: T[]): T[] {
    return items;
  }

  /**
   * Devuelve el elemento, o `null` si no existe. Una vez cargada la lista, la memoria es la
   * fuente de verdad (así un elemento borrado no "resucita" desde la API); antes de eso se
   * consulta `/:id` directamente. Un fallo de red también devuelve `null`.
   */
  getById(id: number): Observable<T | null> {
    if (!Number.isInteger(id)) return of(null);
    if (this._status() === 'ready') return of(this._items().find((item) => item.id === id) ?? null);
    return this.http.get<T>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(null)));
  }

  protected addItem(item: T, at: 'start' | 'end'): Observable<T> {
    return this.http.post(this.apiUrl, item).pipe(
      ignoreServerOutcome(),
      tap(() => this._items.update((list) => (at === 'start' ? [item, ...list] : [...list, item]))),
      map(() => item),
    );
  }

  protected updateItem(item: T): Observable<T> {
    return this.http.put(`${this.apiUrl}/${item.id}`, item).pipe(
      ignoreServerOutcome(),
      tap(() => this._items.update((list) => list.map((current) => (current.id === item.id ? item : current)))),
      map(() => item),
    );
  }

  protected deleteItem(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      ignoreServerOutcome(),
      tap(() => this._items.update((list) => list.filter((item) => item.id !== id))),
    );
  }

  /**
   * Reinserta un elemento borrado en su posición original. Si su id ya está en uso
   * (p. ej. se creó otro reutilizándolo) no hace nada y devuelve `false`.
   */
  protected restoreItem(item: T, index: number): boolean {
    if (this._items().some((current) => current.id === item.id)) return false;
    this._items.update((list) => {
      const copy = [...list];
      copy.splice(Math.min(index, copy.length), 0, item);
      return copy;
    });
    return true;
  }

  protected nextId(): number {
    return this._items().reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }
}
