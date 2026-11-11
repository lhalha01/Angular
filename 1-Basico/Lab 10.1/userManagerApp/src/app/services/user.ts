import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiUser, UserFormData, UserInterface } from '../interfaces/user';

/** URL de la colección de usuarios. Se lee en cada llamada para respetar la configuración activa. */
const usersUrl = (): string => `${environment.apiUrl}/users`;

/** Quita tratamientos ("Mrs.", "Dr."...) que JSONPlaceholder incluye en algunos nombres. */
const HONORIFIC = /^(mr|mrs|ms|miss|dr)\.?\s+/i;

/** Separa "Nombre Apellidos" en first/last (la API solo ofrece un campo `name`). */
function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.replace(HONORIFIC, '').trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

/** Avatar dinámico a partir del nombre (UI Avatars, como recomienda el enunciado). */
function avatarFor(firstName: string, lastName: string): string {
  const name = encodeURIComponent(`${firstName} ${lastName}`.trim());
  return `https://ui-avatars.com/api/?name=${name}&size=128&background=0d6efd&color=fff`;
}

/** Fecha de alta simulada y determinista: 1-ene-2024 + id días. */
function simulatedDate(id: number): Date {
  return new Date(Date.UTC(2024, 0, 1 + id));
}

function fromApi(api: ApiUser): UserInterface {
  const { firstName, lastName } = splitName(api.name);
  return {
    id: api.id,
    firstName,
    lastName,
    email: api.email,
    phone: api.phone ?? '',
    website: api.website ?? '',
    city: api.address?.city ?? '',
    company: api.company?.name ?? '',
    avatar: avatarFor(firstName, lastName),
    createdAt: simulatedDate(api.id),
    isLocal: false,
  };
}

/** Cuerpo que se envía a la API (vuelve a juntar nombre y apellidos en `name`). */
function toApiBody(data: UserFormData): object {
  return {
    name: `${data.firstName} ${data.lastName}`.trim(),
    email: data.email,
    phone: data.phone,
    website: data.website,
    address: { city: data.city },
    company: { name: data.company },
  };
}

/**
 * Servicio de usuarios.
 *
 * Funciona con dos tipos de API, según `environment.persistentApi`:
 *
 * - **API de mentira (JSONPlaceholder, por defecto):** no guarda los cambios (POST/PUT/DELETE
 *   son simulados), así que el servicio mantiene el estado en memoria (`users`): se carga una
 *   vez con GET y a partir de ahí todas las operaciones se reflejan sobre esa copia. Las
 *   llamadas HTTP de escritura se siguen haciendo para practicar `HttpClient`, salvo para los
 *   usuarios creados localmente (la API no los conoce y respondería con error).
 * - **Backend propio (`backend/`, configuración `local`):** sí guarda los cambios. El id de un
 *   alta lo asigna el servidor, todas las escrituras llegan a la API (con PATCH para editar,
 *   porque el formulario no incluye todos los campos y un PUT los borraría) y un error de la
 *   API llega al usuario. La memoria sigue sirviendo para que las vistas reaccionen a los cambios.
 */
@Injectable({ providedIn: 'root' })
export class User {
  private readonly http = inject(HttpClient);

  private readonly _users = signal<UserInterface[]>([]);
  /** Estado en memoria, de solo lectura, para que las vistas reaccionen a los cambios. */
  readonly users = this._users.asReadonly();

  private loaded = false;
  private nextId = 1;

  /** Lista de usuarios: la primera vez llama a la API; después usa la memoria. */
  getUsers(): Observable<UserInterface[]> {
    if (this.loaded) {
      return of(this._users());
    }
    return this.http.get<ApiUser[]>(usersUrl()).pipe(
      map((list) => list.map(fromApi)),
      tap((list) => {
        this._users.set(list);
        this.loaded = true;
        this.nextId = Math.max(0, ...list.map((u) => u.id)) + 1;
      }),
    );
  }

  /** Un usuario por id; `undefined` si no existe. */
  getUser(id: number): Observable<UserInterface | undefined> {
    if (this.loaded) {
      return of(this._users().find((u) => u.id === id));
    }
    // Acceso directo por URL (/users/3) sin lista cargada: se pide solo ese usuario.
    return this.http.get<ApiUser>(`${usersUrl()}/${id}`).pipe(
      map(fromApi),
      catchError(() => of(undefined)),
    );
  }

  /**
   * Crea un usuario. Con el backend propio, el id lo asigna el servidor; con JSONPlaceholder
   * la API devuelve siempre id 11, así que el id se asigna en local.
   */
  addUser(data: UserFormData): Observable<UserInterface> {
    return this.getUsers().pipe(
      switchMap(() => this.http.post<ApiUser>(usersUrl(), toApiBody(data))),
      map((created) => {
        const user: UserInterface = environment.persistentApi
          ? { ...fromApi(created), createdAt: new Date() }
          : {
              id: this.nextId++,
              ...data,
              avatar: avatarFor(data.firstName, data.lastName),
              createdAt: new Date(),
              isLocal: true,
            };
        this._users.update((list) => [...list, user]);
        return user;
      }),
    );
  }

  /** Actualiza un usuario y refleja el cambio en memoria (PUT simulado, o PATCH con el backend propio). */
  updateUser(id: number, data: UserFormData): Observable<UserInterface> {
    return this.getUsers().pipe(
      switchMap((list) => {
        const current = list.find((u) => u.id === id);
        if (!current) {
          return throwError(() => new Error(`Usuario ${id} no encontrado`));
        }
        const updated: UserInterface = {
          ...current,
          ...data,
          avatar: avatarFor(data.firstName, data.lastName),
        };
        // Un usuario creado en local solo existe en memoria si la API es de mentira.
        const request =
          current.isLocal && !environment.persistentApi
            ? of(null)
            : environment.persistentApi
              ? this.http.patch<unknown>(`${usersUrl()}/${id}`, toApiBody(data))
              : this.http.put<unknown>(`${usersUrl()}/${id}`, toApiBody(data));
        return request.pipe(
          tap(() => this._users.update((l) => l.map((u) => (u.id === id ? updated : u)))),
          map(() => updated),
        );
      }),
    );
  }

  /**
   * Cuántas tareas (`/todos`) tiene asignadas un usuario.
   *
   * Con el backend propio, borrar un usuario borra también sus tareas (borrado en cascada), así
   * que la interfaz necesita saberlo para avisar antes. Se lo pregunta al servidor con
   * `GET /todos?userId=…&_limit=1` y se lee el total de la cabecera `X-Total-Count` (con
   * `_limit=1` no se descarga ninguna tarea de más). Con la API pública no hay cascada y devuelve
   * 0 sin hacer ninguna petición. Falla si el servidor no informa del total: es preferible no
   * avisar a avisar de un "0" que no es verdad.
   */
  countTasks(userId: number): Observable<number> {
    if (!environment.persistentApi) {
      return of(0);
    }
    return this.http
      .get<unknown[]>(`${environment.apiUrl}/todos`, {
        params: { userId, _limit: 1 },
        observe: 'response',
      })
      .pipe(
        map((response) => {
          const header = response.headers.get('X-Total-Count')?.trim();
          // Solo dígitos: `Number('')` vale 0 y `Number('-3')` o `Number('1.5')` no son totales válidos.
          if (header === undefined || !/^\d+$/.test(header)) {
            throw new Error('El servidor no informó de cuántas tareas tiene el usuario');
          }
          return Number(header);
        }),
      );
  }

  /** Elimina un usuario (DELETE, simulado con JSONPlaceholder) y lo quita de la memoria. */
  deleteUser(id: number): Observable<void> {
    return this.getUsers().pipe(
      switchMap((list) => {
        const current = list.find((u) => u.id === id);
        if (!current) {
          return throwError(() => new Error(`Usuario ${id} no encontrado`));
        }
        const request =
          current.isLocal && !environment.persistentApi
            ? of(null)
            : this.http.delete<unknown>(`${usersUrl()}/${id}`);
        return request.pipe(
          tap(() => this._users.update((l) => l.filter((u) => u.id !== id))),
          map(() => undefined),
        );
      }),
    );
  }
}
