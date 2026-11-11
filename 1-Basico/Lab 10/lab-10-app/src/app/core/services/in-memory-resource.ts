import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ignoreServerOutcome } from './ignore-server-outcome';

export type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Base para recursos REST cuyo estado vive en memoria. Aporta la carga inicial, el estado como
 * `signal`, la búsqueda por id y las operaciones de añadir, actualizar, borrar y restaurar. Cada
 * servicio concreto (tareas, usuarios) solo añade su vocabulario y sus reglas.
 *
 * Funciona con dos tipos de API, según `environment.persistentApi`:
 *
 * - **API de mentira (JSONPlaceholder, por defecto):** no guarda cambios, así que las escrituras se
 *   aplican en memoria y la petición se envía "para practicar": su respuesta y sus errores se
 *   ignoran (`ignoreServerOutcome`) y los ids los genera el cliente.
 * - **Backend propio (`backend/`, configuración `local`):** sí guarda los cambios. El id lo asigna
 *   el servidor, se usa lo que responde y sus errores llegan al llamante, que debe avisar al usuario
 *   (véase `describeApiError`). La memoria sigue siendo lo que leen las vistas.
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

  /** Se lee en cada operación, para respetar la configuración activa. */
  private get persistent(): boolean {
    return environment.persistentApi;
  }

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

  /**
   * Añade un elemento. Con la API de mentira se guarda tal cual (con el id del cliente); con el
   * backend propio se envía sin `id`, que asigna el servidor, y se guarda lo que este devuelve.
   */
  protected addItem(item: T, at: 'start' | 'end'): Observable<T> {
    if (this.persistent) {
      const body: Partial<T> = { ...item };
      delete body.id;
      return this.http.post<T>(this.apiUrl, body).pipe(
        map((created) => this.prepare([created])[0]),
        tap((created) => this.applyInsert(created, at)),
      );
    }
    return this.http.post(this.apiUrl, item).pipe(
      ignoreServerOutcome(),
      tap(() => this.applyInsert(item, at)),
      map(() => item),
    );
  }

  protected updateItem(item: T): Observable<T> {
    if (this.persistent) {
      return this.http.put<T>(`${this.apiUrl}/${item.id}`, item).pipe(
        map((saved) => this.prepare([saved])[0]),
        tap((saved) => this.applyReplace(saved)),
      );
    }
    return this.http.put(`${this.apiUrl}/${item.id}`, item).pipe(
      ignoreServerOutcome(),
      tap(() => this.applyReplace(item)),
      map(() => item),
    );
  }

  protected deleteItem(id: number): Observable<void> {
    if (this.persistent) {
      return this.http.delete(`${this.apiUrl}/${id}`).pipe(
        tap(() => this.applyRemove(id)),
        map(() => undefined),
      );
    }
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      ignoreServerOutcome(),
      tap(() => this.applyRemove(id)),
    );
  }

  /**
   * Reinserta un elemento borrado en su posición original ("Deshacer"). Emite `false`, sin hacer
   * nada, si su id ya está en uso (p. ej. se creó otro reutilizándolo).
   *
   * Con el backend propio hay que recrearlo allí con su mismo id (y su fecha): el servidor lo
   * acepta si el id está libre y responde 409 si no; cualquier otro error se propaga.
   */
  protected restoreItem(item: T, index: number): Observable<boolean> {
    if (this._items().some((current) => current.id === item.id)) return of(false);
    if (!this.persistent) return of(this.applyInsertAt(item, index));

    return this.http.post<T>(this.apiUrl, item).pipe(
      map((created) => this.applyInsertAt(this.prepare([created])[0], index)),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 409 ? of(false) : throwError(() => error),
      ),
    );
  }

  protected nextId(): number {
    return this._items().reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  private applyInsert(item: T, at: 'start' | 'end'): void {
    this._items.update((list) => (at === 'start' ? [item, ...list] : [...list, item]));
  }

  private applyReplace(item: T): void {
    this._items.update((list) => list.map((current) => (current.id === item.id ? item : current)));
  }

  private applyRemove(id: number): void {
    this._items.update((list) => list.filter((item) => item.id !== id));
  }

  private applyInsertAt(item: T, index: number): true {
    this._items.update((list) => {
      const copy = [...list];
      copy.splice(Math.min(index, copy.length), 0, item);
      return copy;
    });
    return true;
  }
}
