import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Deja pasar solo con sesión iniciada; si no, redirige a `/login?returnUrl=<destino>`. */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.auth.estaAutenticado()) return true;
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
}
