import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const estado = (url: string) => ({ url }) as RouterStateSnapshot;
  const ejecutar = (url: string) => TestBed.inject(AuthGuard).canActivate({} as never, estado(url));

  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('permite el acceso con sesión iniciada', () => {
    TestBed.inject(AuthService).login('a', 'b');
    expect(ejecutar('/dashboard')).toBeTrue();
  });

  it('sin sesión redirige a /login con el destino en returnUrl', () => {
    const resultado = ejecutar('/dashboard') as UrlTree;
    expect(resultado instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/login?returnUrl=%2Fdashboard');
  });
});
