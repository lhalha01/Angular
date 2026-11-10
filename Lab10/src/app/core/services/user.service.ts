import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { User } from '../models/user.model';

/** Consume /users de JSONPlaceholder una sola vez y expone el resultado como signal. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  private readonly _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();

  /** Índice id -> nombre para resolver nombres en O(1) desde las plantillas. */
  private readonly names = computed(() => new Map(this._users().map((u) => [u.id, u.name])));

  constructor() {
    this.http
      .get<User[]>(this.apiUrl)
      .pipe(catchError(() => of<User[]>([])))
      .subscribe((users) => this._users.set(users));
  }

  nameOf(id: number): string {
    return this.names().get(id) ?? `Usuario #${id}`;
  }
}
