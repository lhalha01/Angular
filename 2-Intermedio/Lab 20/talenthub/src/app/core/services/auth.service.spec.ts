import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    auth = TestBed.inject(AuthService);
  });
  afterEach(() => sessionStorage.clear());

  it('no está autenticado al empezar', () => {
    expect(auth.estaAutenticado()).toBeFalse();
    expect(auth.getToken()).toBeNull();
  });

  it('login guarda un token opaco en sessionStorage y deja autenticado', () => {
    auth.login('ana@example.com', 'cualquiera');
    expect(auth.estaAutenticado()).toBeTrue();
    expect(auth.getToken()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('el token no contiene el email ni la contraseña', () => {
    auth.login('ana@example.com', 'secreto');
    expect(auth.getToken()).not.toContain('ana');
    expect(auth.getToken()).not.toContain('secreto');
  });

  it('cada login genera un token distinto', () => {
    auth.login('a', 'b');
    const primero = auth.getToken();
    auth.login('a', 'b');
    expect(auth.getToken()).not.toBe(primero);
  });

  it('logout elimina el token', () => {
    auth.login('a', 'b');
    auth.logout();
    expect(auth.estaAutenticado()).toBeFalse();
    expect(auth.getToken()).toBeNull();
  });

  it('la sesión se guarda en sessionStorage, no en localStorage', () => {
    auth.login('a', 'b');
    expect(sessionStorage.getItem('talenthub_session')).not.toBeNull();
    expect(localStorage.getItem('talenthub_session')).toBeNull();
  });
});
