import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { UserInterface } from '../interfaces/user';
import { Notifier } from './notification';
import { User } from './user';

/** Texto de la confirmación. Si el usuario tiene tareas, avisa de que se borrarán con él. */
export function confirmMessage(name: string, tasks: number): string {
  if (tasks === 0) {
    return `¿Eliminar a ${name}?`;
  }
  const assigned = tasks === 1 ? '1 tarea asignada' : `${tasks} tareas asignadas`;
  // El verbo concuerda con lo que se borra: "se eliminará su tarea" / "se eliminarán sus 20 tareas".
  const alsoDeleted = tasks === 1 ? 'se eliminará su tarea' : `se eliminarán sus ${tasks} tareas`;
  return (
    `${name} tiene ${assigned}.\n\n` +
    `Si lo eliminas, también ${alsoDeleted}. Esta acción no se puede deshacer.\n\n` +
    '¿Eliminar al usuario y sus tareas?'
  );
}

/** Texto del aviso tras borrar. */
export function deletedMessage(name: string, tasks: number): string {
  if (tasks === 0) {
    return `Usuario ${name} eliminado`;
  }
  return `Usuario ${name} eliminado junto con ${tasks === 1 ? 'su tarea' : `sus ${tasks} tareas`}`;
}

/**
 * Acciones de usuario sobre un usuario que combinan varios pasos: comprobar sus tareas, pedir
 * confirmación, borrar y avisar del resultado. Las usan la lista y el detalle, para que borrar
 * se comporte igual en los dos sitios.
 */
@Injectable({ providedIn: 'root' })
export class UserActions {
  private readonly users = inject(User);
  private readonly notifier = inject(Notifier);

  /**
   * Borra un usuario, previa confirmación. Con el backend propio, avisa antes de cuántas tareas
   * se borrarán con él (borrado en cascada). Emite `true` si se borró; `false` si el usuario
   * canceló o algo falló (en ese caso ya se ha avisado). Nunca emite error.
   *
   * Se comprueba el número de tareas **antes** de preguntar: si no se pudiera comprobar, no se
   * borra nada, porque el usuario confirmaría sin saber qué pierde.
   */
  remove(user: UserInterface): Observable<boolean> {
    const name = `${user.firstName} ${user.lastName}`;

    return this.users.countTasks(user.id).pipe(
      map((tasks): number | null => tasks),
      catchError(() => {
        this.notifier.show(
          'No se pudo comprobar si el usuario tiene tareas, así que no se ha eliminado.',
          'error',
        );
        return of(null);
      }),
      switchMap((tasks) => {
        if (tasks === null || !window.confirm(confirmMessage(name, tasks))) {
          return of(false);
        }
        return this.users.deleteUser(user.id).pipe(
          tap(() => this.notifier.show(deletedMessage(name, tasks))),
          map(() => true),
          catchError(() => {
            this.notifier.show('No se pudo eliminar el usuario', 'error');
            return of(false);
          }),
        );
      }),
    );
  }
}
