import { Injectable } from '@angular/core';

/**
 * Acceso a `localStorage` que nunca lanza: en modo privado, con el almacenamiento bloqueado
 * o lleno, leer devuelve `null` y escribir no hace nada, y la app sigue funcionando
 * (la preferencia solo dura la sesión).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Se ignora: ver la descripción de la clase.
    }
  }

  /** Lee un valor guardado y lo valida: devuelve `null` si falta o no es uno de los permitidos. */
  getOneOf<T extends string>(key: string, allowed: readonly T[]): T | null {
    const value = this.get(key);
    return allowed.find((option) => option === value) ?? null;
  }
}
