import { Injectable, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, defer, map, switchMap } from 'rxjs';
import { UserInterface } from '../interfaces/user';
import { Usuario } from '../models/usuario.model';
import { User } from './user';

/** Convierte el usuario de la aplicación (Lab 10.1) en el modelo simple de este laboratorio. */
function aUsuario(u: UserInterface): Usuario {
  return {
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    // Los usuarios creados en local no traen alias: se usa la parte local del email.
    username: u.username ?? u.email.split('@')[0],
    email: u.email,
    avatar: u.avatar,
  };
}

/**
 * Capa fina sobre el servicio `User` del Lab 10.1 con la API que esperan los ejemplos
 * de Observables: `usuarios$`, `obtenerUsuarios()` y `obtenerUsuario(id)`.
 * No duplica datos ni peticiones: todo sale del estado en memoria de `User`.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly userService = inject(User);
  private readonly injector = inject(Injector);

  /**
   * Flujo "vivo" de usuarios: emite la lista al cargarla y vuelve a emitir cada vez que
   * cambia (alta, edición o borrado). Es el patrón Observer: los suscriptores reaccionan
   * a los cambios sin preguntar. Se carga de forma perezosa, al suscribirse.
   */
  readonly usuarios$: Observable<Usuario[]> = defer(() => this.userService.getUsers()).pipe(
    // `toObservable` convierte el signal de usuarios en un Observable (puente signals → RxJS).
    switchMap(() => toObservable(this.userService.users, { injector: this.injector })),
    map((lista) => lista.map(aUsuario)),
  );

  /** Lista de usuarios (una sola emisión y completa). */
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.userService.getUsers().pipe(map((lista) => lista.map(aUsuario)));
  }

  /** Un usuario por id; `undefined` si no existe. */
  obtenerUsuario(id: number): Observable<Usuario | undefined> {
    return this.userService.getUser(id).pipe(map((u) => (u ? aUsuario(u) : undefined)));
  }
}
