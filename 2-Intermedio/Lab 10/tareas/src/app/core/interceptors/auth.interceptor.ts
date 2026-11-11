import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Añade `Authorization: Bearer <token>` a las peticiones a nuestra API cuando hay sesión. No se añade a otras
 * direcciones: el token no debe viajar a servidores de terceros. (El token es un identificador opaco simulado.)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token === null || !req.url.startsWith(environment.apiUrl)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
