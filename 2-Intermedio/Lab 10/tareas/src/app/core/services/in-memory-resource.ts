import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { reintentarConEspera } from '../http/reintentar';
import { ERRORES_ESPERADOS, NOTIFICAR_ERRORES, OPERACION } from '../interceptors/http-context';
import { ignoreServerOutcome } from './ignore-server-outcome';

export type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Base para recursos REST cuyo estado vive en memoria. Aporta la carga inicial, el estado como
 * `signal`, la búsqueda por id y las operaciones de añadir, actualizar, borrar y restaurar. Cada
 * servicio concreto (tareas, usuarios) solo añade su vocabulario y sus reglas.
 *
 * Funciona con dos tipos de API, según `environment.persistentApi`:
 *
 * - **API de mentira (JSONPlaceholder, `npm run start:public`):** no guarda cambios, así que las escrituras
 *   se aplican en memoria y la petición se envía "para practicar": su respuesta y sus errores se
 *   ignoran (`ignoreServerOutcome`, y el interceptor de errores no avisa) y los ids los genera el cliente.
 * - **Backend propio (`backend/`, el modo normal del nivel Intermedio):** sí guarda los cambios. El id lo
 *   asigna el servidor, se usa lo que responde y sus errores se notifican al usuario (el interceptor de
 *   errores, con el texto de la operación que se intentaba). La memoria sigue siendo lo que leen las vistas.
 *
 * La traducción entre el formato de la API (DTO) y el dominio es cosa de las subclases (`fromApi` y `toApi`):
 * los DTO no salen del servicio. Las subclases llaman a `this.reload()` al final de su constructor.
 */
export abstract class InMemoryResource<T extends { id: number }> {
  protected readonly http = inject(HttpClient);
  /** URL de la colección, p. ej. `https://…/todos`. */
  protected abstract readonly apiUrl: string;
  /** Cómo se llama la colección en los avisos de error («las tareas»). */
  protected readonly etiqueta: string = 'los datos';

  /**
   * Traduce un elemento JSON de la API al modelo de dominio, o `null` si no tiene la forma esperada: es la
   * frontera de datos, y lo que no encaja se descarta antes de que llegue al resto de la aplicación.
   */
  protected abstract fromApi(json: unknown): T | null;

  /**
   * Traduce un elemento del dominio al cuerpo que espera la API. Por defecto, tal cual; `conId` indica si el
   * cuerpo debe llevar el `id` (al sustituir o restaurar sí; al crear con el backend propio no, lo asigna él).
   */
  protected toApi(item: T, conId: boolean): unknown {
    const body: Partial<T> = { ...item };
    if (!conId) delete body.id;
    return body;
  }

  private readonly _items = signal<T[]>([]);
  private readonly _status = signal<LoadStatus>('loading');

  readonly items = this._items.asReadonly();
  readonly status = this._status.asReadonly();

  /** Se lee en cada operación, para respetar la configuración activa. */
  private get persistent(): boolean {
    return environment.persistentApi;
  }

  /**
   * Contexto de una petición: qué se intentaba (para el texto del aviso), qué estados de error maneja el
   * propio llamante (el interceptor no los avisa) y si hay que avisar de los errores (no, con la API de mentira).
   */
  private contexto(operacion: string, esperados: readonly number[] = [], notificar = true): HttpContext {
    return new HttpContext()
      .set(OPERACION, operacion)
      .set(ERRORES_ESPERADOS, esperados)
      .set(NOTIFICAR_ERRORES, notificar);
  }

  /**
   * Carga (o recarga) la colección desde la API, descartando lo que hubiera en memoria. Si falla por conexión o
   * por el servidor reintenta 2 veces, con espera; el estado pasa a `error` solo cuando se agotan los intentos.
   */
  reload(): void {
    this._status.set('loading');
    this.http
      .get<unknown>(this.apiUrl, { context: this.contexto(`No se pudieron cargar ${this.etiqueta}`) })
      .pipe(reintentarConEspera())
      .subscribe({
        next: (body) => {
          if (!Array.isArray(body)) {
            this._status.set('error');
            return;
          }
          const items = body.map((json) => this.fromApi(json)).filter((item): item is T => item !== null);
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
   * consulta `/:id` directamente. El 404 es una respuesta esperada (no se avisa); un fallo de red
   * o del servidor también devuelve `null`, pero ese sí lo avisa el interceptor.
   */
  getById(id: number): Observable<T | null> {
    if (!Number.isInteger(id)) return of(null);
    if (this._status() === 'ready') return of(this._items().find((item) => item.id === id) ?? null);
    return this.http
      .get<unknown>(`${this.apiUrl}/${id}`, { context: this.contexto('No se pudo consultar el dato solicitado', [404]) })
      .pipe(
        map((json) => this.fromApi(json)),
        catchError(() => of(null)),
      );
  }

  /**
   * Añade un elemento. Con la API de mentira se guarda tal cual (con el id del cliente); con el
   * backend propio se envía sin `id`, que asigna el servidor, y se guarda lo que este devuelve.
   */
  protected addItem(item: T, at: 'start' | 'end', operacion = 'No se pudo crear el elemento'): Observable<T> {
    if (this.persistent) {
      return this.http.post<unknown>(this.apiUrl, this.toApi(item, false), { context: this.contexto(operacion) }).pipe(
        map((json) => this.creado(json)),
        tap((created) => this.applyInsert(created, at)),
      );
    }
    return this.http.post<unknown>(this.apiUrl, this.toApi(item, true), { context: this.contexto(operacion, [], false) }).pipe(
      ignoreServerOutcome(),
      tap(() => this.applyInsert(item, at)),
      map(() => item),
    );
  }

  protected updateItem(item: T, operacion = 'No se pudo actualizar el elemento'): Observable<T> {
    const url = `${this.apiUrl}/${item.id}`;
    if (this.persistent) {
      return this.http.put<unknown>(url, this.toApi(item, true), { context: this.contexto(operacion) }).pipe(
        map((json) => this.creado(json)),
        tap((saved) => this.applyReplace(saved)),
      );
    }
    return this.http.put<unknown>(url, this.toApi(item, true), { context: this.contexto(operacion, [], false) }).pipe(
      ignoreServerOutcome(),
      tap(() => this.applyReplace(item)),
      map(() => item),
    );
  }

  protected deleteItem(id: number, operacion = 'No se pudo eliminar el elemento'): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    if (this.persistent) {
      return this.http.delete<unknown>(url, { context: this.contexto(operacion) }).pipe(
        tap(() => this.applyRemove(id)),
        map(() => undefined),
      );
    }
    return this.http.delete<unknown>(url, { context: this.contexto(operacion, [], false) }).pipe(
      ignoreServerOutcome(),
      tap(() => this.applyRemove(id)),
    );
  }

  /**
   * Reinserta un elemento borrado en su posición original ("Deshacer"). Emite `false`, sin hacer
   * nada, si su id ya está en uso (p. ej. se creó otro reutilizándolo).
   *
   * Con el backend propio hay que recrearlo allí con su mismo id (y su fecha): el servidor lo
   * acepta si el id está libre y responde 409 si no (el 409 lo maneja este método, así que el interceptor
   * no lo avisa); cualquier otro error se propaga y se avisa.
   */
  protected restoreItem(item: T, index: number, operacion = 'No se pudo restaurar el elemento'): Observable<boolean> {
    if (this._items().some((current) => current.id === item.id)) return of(false);
    if (!this.persistent) return of(this.applyInsertAt(item, index));

    return this.http.post<unknown>(this.apiUrl, this.toApi(item, true), { context: this.contexto(operacion, [409]) }).pipe(
      map((json) => this.applyInsertAt(this.creado(json), index)),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 409 ? of(false) : throwError(() => error),
      ),
    );
  }

  protected nextId(): number {
    return this._items().reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  /** Lo que devuelve el servidor al guardar: se traduce al dominio y se completa; si no encaja, es un error. */
  private creado(json: unknown): T {
    const item = this.fromApi(json);
    if (item === null) throw new Error('La API devolvió un elemento con una forma inesperada.');
    return this.prepare([item])[0];
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
