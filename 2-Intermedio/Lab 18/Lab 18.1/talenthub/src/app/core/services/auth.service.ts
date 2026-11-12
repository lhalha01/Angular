import { Injectable } from '@angular/core';

/**
 * Autenticación simulada de TalentHub (Lab 13).
 *
 * NOTA: en producción el token lo emite el backend tras validar las credenciales y no debe contener datos
 * del usuario. Aquí se simula con un identificador opaco generado en el frontend, solo para el ejercicio:
 * no hay ninguna comprobación de credenciales ni seguridad real.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'talenthub_session';

  estaAutenticado(): boolean {
    return sessionStorage.getItem(this.TOKEN_KEY) !== null;
  }

  /** Inicia sesión con cualquier email y contraseña (los argumentos se ignoran a propósito en este ejercicio). */
  login(_email: string, _password: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, crypto.randomUUID());
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
}
