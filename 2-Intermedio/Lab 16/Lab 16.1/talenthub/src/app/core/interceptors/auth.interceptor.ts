import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Añade `Authorization: Bearer <token>` a las peticiones a nuestra API cuando hay sesión. No se añade a otras
 * direcciones: el token no debe viajar a servidores de terceros.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token === null || !req.url.startsWith(environment.apiUrl)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
