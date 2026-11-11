import { TestBed } from '@angular/core/testing';
import { Router, UrlSegment, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const segmentos = (...paths: string[]) => paths.map((p) => new UrlSegment(p, {}));
  const ejecutar = (...paths: string[]) =>
    TestBed.runInInjectionContext(() => authGuard({} as never, segmentos(...paths)));

  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('permite el acceso con sesión iniciada', () => {
    TestBed.inject(AuthService).login('t');
    expect(ejecutar('tasks')).toBeTrue();
  });

  it('sin sesión redirige a /login con el destino en returnUrl', () => {
    const resultado = ejecutar('tasks') as UrlTree;
    expect(resultado instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/login?returnUrl=%2Ftasks');
  });

  it('conserva todos los segmentos del destino', () => {
    const resultado = ejecutar('tasks', '5', 'edit') as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/login?returnUrl=%2Ftasks%2F5%2Fedit');
  });
});
