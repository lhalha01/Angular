import { computed, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserDraft } from '../models/user.model';
import { InMemoryResource } from './in-memory-resource';

/**
 * Servicio de usuarios mockeado (ver Servicios_mock.md): listar, obtener por id, crear y
 * eliminar contra JSONPlaceholder (`/users`), con el estado en memoria.
 */
@Injectable({ providedIn: 'root' })
export class UserService extends InMemoryResource<User> {
  protected readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  readonly users = this.items;

  /** Índice id -> nombre para resolver nombres en O(1) desde las plantillas. */
  private readonly names = computed(() => new Map(this.users().map((u) => [u.id, u.name])));

  constructor() {
    super();
    this.reload();
  }

  /** Nombre del usuario, o un texto de reserva mientras carga o si no existe. */
  nameOf(id: number): string {
    return this.names().get(id) ?? `Usuario #${id}`;
  }

  getUserById(id: number): Observable<User | null> {
    return this.getById(id);
  }

  addUser(draft: UserDraft): Observable<User> {
    return this.addItem({ ...draft, id: this.nextId() }, 'end');
  }

  deleteUser(id: number): Observable<void> {
    return this.deleteItem(id);
  }
}
