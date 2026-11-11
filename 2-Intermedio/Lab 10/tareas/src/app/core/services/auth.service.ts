import { Injectable, signal } from '@angular/core';

/**
 * Autenticación simulada (Lab 13.2): el token vive en `sessionStorage`, así que se pierde al cerrar la pestaña.
 *
 * NOTA: en una aplicación real el token lo emite el servidor tras validar las credenciales y no contiene datos
 * del usuario. Aquí es un identificador opaco generado en el cliente solo para el ejercicio: no hay ninguna
 * seguridad real.
 *
 * `estaAutenticado()` lee siempre `sessionStorage` (la fuente de verdad, que usan los guards). La señal
 * `autenticado` se mantiene sincronizada con ella para que la cabecera reaccione sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly _autenticado = signal(sessionStorage.getItem(this.TOKEN_KEY) !== null);

  readonly autenticado = this._autenticado.asReadonly();

  estaAutenticado(): boolean {
    return sessionStorage.getItem(this.TOKEN_KEY) !== null;
  }

  /** El token de la sesión (lo lee el interceptor de autenticación), o `null` si no hay sesión. */
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  login(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this._autenticado.set(true);
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this._autenticado.set(false);
  }
}
