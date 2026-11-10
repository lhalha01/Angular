import { Injectable } from '@angular/core';

/** Registro mínimo por consola. Centralizarlo permite cambiar el destino de los logs en un solo sitio. */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  info(mensaje: string): void {
    console.info(`[INFO] ${mensaje}`);
  }

  warn(mensaje: string): void {
    console.warn(`[WARN] ${mensaje}`);
  }

  error(mensaje: string, error?: unknown): void {
    console.error(`[ERROR] ${mensaje}`, error ?? '');
  }
}
