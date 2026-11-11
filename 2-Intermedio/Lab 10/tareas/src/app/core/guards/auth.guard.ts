import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Deja pasar solo con sesión iniciada; si no, redirige a `/login?returnUrl=<destino>`.
 *
 * Se usa como `canMatch`: las rutas protegidas ni siquiera se cargan (su chunk no se descarga). Por eso es un
 * `CanMatchFn`, que recibe `(route, segments)` y no el estado de la navegación: el enunciado lo escribe como
 * `CanActivateFn` leyendo `state.url`, que con `canMatch` no existe. El destino se toma de la navegación en
 * curso (con sus parámetros) y, si no hay, de los segmentos.
 */
export const authGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;

  const destino =
    router.getCurrentNavigation()?.extractedUrl.toString() ?? '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: destino } });
};
