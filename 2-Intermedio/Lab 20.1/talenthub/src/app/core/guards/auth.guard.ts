import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Deja pasar solo con sesión iniciada; si no, redirige a `/login?returnUrl=<destino>`.
 *
 * Se usa como `canMatch` (la ruta protegida ni siquiera se carga: su chunk no se descarga). Por eso es un
 * `CanMatchFn`: recibe `(route, segments)`, no el estado de la navegación. El enunciado lo escribe como
 * `CanActivateFn` leyendo `state.url`, que con `canMatch` no existe. La URL de destino se toma de la
 * navegación en curso (con sus parámetros) y, si no hay, de los segmentos.
 */
export const authGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;

  const destino =
    router.getCurrentNavigation()?.extractedUrl.toString() ?? '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: destino } });
};
