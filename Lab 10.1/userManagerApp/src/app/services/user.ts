import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { ApiUser, UserFormData, UserInterface } from '../interfaces/user';

const API_URL = 'https://jsonplaceholder.typicode.com/users';

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
 * JSONPlaceholder no guarda los cambios (POST/PUT/DELETE son simulados), así que
 * el servicio mantiene el estado en memoria (`users`): se carga una vez con GET y
 * a partir de ahí todas las operaciones se reflejan sobre esa copia. Las llamadas
 * HTTP de escritura se siguen haciendo para practicar `HttpClient`, salvo para los
 * usuarios creados localmente (la API no los conoce y respondería con error).
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
    return this.http.get<ApiUser[]>(API_URL).pipe(
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
    return this.http.get<ApiUser>(`${API_URL}/${id}`).pipe(
      map(fromApi),
      catchError(() => of(undefined)),
    );
  }

  /** Crea un usuario. La API devuelve siempre id 11, así que el id se asigna en local. */
  addUser(data: UserFormData): Observable<UserInterface> {
    return this.getUsers().pipe(
      switchMap(() => this.http.post<unknown>(API_URL, toApiBody(data))),
      map(() => {
        const id = this.nextId++;
        const user: UserInterface = {
          id,
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

  /** Actualiza un usuario (PUT simulado) y refleja el cambio en memoria. */
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
        const request = current.isLocal
          ? of(null)
          : this.http.put<unknown>(`${API_URL}/${id}`, toApiBody(data));
        return request.pipe(
          tap(() => this._users.update((l) => l.map((u) => (u.id === id ? updated : u)))),
          map(() => updated),
        );
      }),
    );
  }

  /** Elimina un usuario (DELETE simulado) y lo quita de la memoria. */
  deleteUser(id: number): Observable<void> {
    return this.getUsers().pipe(
      switchMap((list) => {
        const current = list.find((u) => u.id === id);
        if (!current) {
          return throwError(() => new Error(`Usuario ${id} no encontrado`));
        }
        const request = current.isLocal
          ? of(null)
          : this.http.delete<unknown>(`${API_URL}/${id}`);
        return request.pipe(
          tap(() => this._users.update((l) => l.filter((u) => u.id !== id))),
          map(() => undefined),
        );
      }),
    );
  }
}
