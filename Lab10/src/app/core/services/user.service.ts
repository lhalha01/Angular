import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { User, UserDraft } from '../models/user.model';

/**
 * Servicio de usuarios mockeado (ver Servicios_mock.md): listar, obtener por id,
 * crear y eliminar contra JSONPlaceholder. Como la API no persiste, la lista vive en
 * memoria y el resultado local manda sobre la respuesta (o el fallo) de la API.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  private readonly _users = signal<User[]>([]);
  private readonly _loaded = signal(false);
  readonly users = this._users.asReadonly();

  /** Índice id -> nombre para resolver nombres en O(1) desde las plantillas. */
  private readonly names = computed(() => new Map(this._users().map((u) => [u.id, u.name])));

  constructor() {
    this.http
      .get<User[]>(this.apiUrl)
      .pipe(catchError(() => of<User[]>([])))
      .subscribe((users) => {
        this._users.set(users);
        this._loaded.set(users.length > 0);
      });
  }

  /** Nombre del usuario, o un texto de reserva mientras carga o si no existe. */
  nameOf(id: number): string {
    return this.names().get(id) ?? `Usuario #${id}`;
  }

  /** Usuario por id (`null` si no existe). Con la lista cargada se resuelve en memoria. */
  getUserById(id: number): Observable<User | null> {
    if (!Number.isInteger(id)) return of(null);
    if (this._loaded()) return of(this._users().find((u) => u.id === id) ?? null);
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(null)));
  }

  addUser(draft: UserDraft): Observable<User> {
    const user: User = { ...draft, id: this.nextId() };
    return this.http.post<User>(this.apiUrl, user).pipe(
      catchError(() => of(user)),
      // La API responde siempre con el mismo id: se ignora para no duplicar ids.
      map(() => user),
      tap((created) => this._users.update((list) => [...list, created])),
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(null)),
      tap(() => this._users.update((list) => list.filter((u) => u.id !== id))),
      map(() => undefined),
    );
  }

  private nextId(): number {
    return this._users().reduce((max, u) => Math.max(max, u.id), 0) + 1;
  }
}
