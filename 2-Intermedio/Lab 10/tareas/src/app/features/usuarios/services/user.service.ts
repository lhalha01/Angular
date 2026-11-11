import { computed, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, UserDraft, isUser } from '../models/user.model';
import { InMemoryResource } from '@core/services/in-memory-resource';

/**
 * Servicio de usuarios mockeado (ver Servicios_mock.md): listar, obtener por id, crear y
 * eliminar contra JSONPlaceholder (`/users`) o, en la configuración `local`, contra el backend
 * propio, con el estado en memoria.
 */
@Injectable({ providedIn: 'root' })
export class UserService extends InMemoryResource<User> {
  protected readonly apiUrl = `${environment.apiUrl}/users`;

  protected override isItem = isUser;

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

  /**
   * Con el backend propio, borrar un usuario borra también sus tareas allí (borrado en cascada).
   * La aplicación no ofrece borrar usuarios, así que `TaskService` no se entera: si algún día se
   * añade esa opción, habrá que llamar a `TaskService.reload()` después.
   */
  deleteUser(id: number): Observable<void> {
    return this.deleteItem(id);
  }
}
