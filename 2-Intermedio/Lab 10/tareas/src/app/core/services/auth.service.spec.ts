import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('no está autenticado al empezar', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.estaAutenticado()).toBeFalse();
    expect(auth.autenticado()).toBeFalse();
  });

  it('login guarda el token en sessionStorage y deja autenticado', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('abc-123');
    expect(sessionStorage.getItem('auth_token')).toBe('abc-123');
    expect(auth.estaAutenticado()).toBeTrue();
    expect(auth.autenticado()).toBeTrue();
  });

  it('logout elimina el token', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('abc-123');
    auth.logout();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(auth.estaAutenticado()).toBeFalse();
    expect(auth.autenticado()).toBeFalse();
  });

  it('retoma la sesión si ya había un token (p. ej. al recargar la página)', () => {
    sessionStorage.setItem('auth_token', 'previo');
    const auth = TestBed.inject(AuthService);
    expect(auth.estaAutenticado()).toBeTrue();
    expect(auth.autenticado()).toBeTrue();
  });

  it('getToken devuelve el token de la sesión, o null sin ella', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.getToken()).toBeNull();
    auth.login('abc-123');
    expect(auth.getToken()).toBe('abc-123');
    auth.logout();
    expect(auth.getToken()).toBeNull();
  });

  it('la sesión vive en sessionStorage, no en localStorage', () => {
    TestBed.inject(AuthService).login('abc-123');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
