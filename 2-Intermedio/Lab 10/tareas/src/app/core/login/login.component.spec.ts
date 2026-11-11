import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { destinoSeguro, Login } from './login.component';

describe('destinoSeguro', () => {
  it('admite rutas internas', () => {
    expect(destinoSeguro('/tasks/1')).toBe('/tasks/1');
    expect(destinoSeguro('/tasks?estado=pending')).toBe('/tasks?estado=pending');
  });

  it('sin destino vuelve al inicio', () => {
    expect(destinoSeguro(null)).toBe('/');
    expect(destinoSeguro('')).toBe('/');
  });

  it('rechaza destinos externos o manipulados', () => {
    expect(destinoSeguro('https://malo.example/')).toBe('/');
    expect(destinoSeguro('//malo.example/')).toBe('/');
    expect(destinoSeguro('javascript:alert(1)')).toBe('/');
  });
});

describe('Login', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();
  });
  afterEach(() => sessionStorage.clear());

  function enviar(fixture: ReturnType<typeof TestBed.createComponent<Login>>) {
    const el = fixture.nativeElement as HTMLElement;
    const escribir = (name: string, valor: string) => {
      const input = el.querySelector<HTMLInputElement>(`input[name=${name}]`)!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };
    escribir('email', 'ana@example.com');
    escribir('password', 'lo-que-sea');
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  it('acepta cualquier email y contraseña, guarda un token opaco e inicia sesión', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    enviar(fixture);

    expect(TestBed.inject(AuthService).estaAutenticado()).toBeTrue();
    const token = sessionStorage.getItem('auth_token')!;
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(token).not.toContain('ana');
    expect(navegar).toHaveBeenCalledOnceWith('/');
  });

  it('tras entrar vuelve a la URL de returnUrl', async () => {
    await TestBed.inject(Router).navigateByUrl('/login?returnUrl=%2Ftasks%2F3');
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    enviar(fixture);

    expect(navegar).toHaveBeenCalledOnceWith('/tasks/3');
  });

  it('ignora un returnUrl externo', async () => {
    await TestBed.inject(Router).navigateByUrl('/login?returnUrl=https:%2F%2Fmalo.example');
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    enviar(fixture);

    expect(navegar).toHaveBeenCalledOnceWith('/');
  });
});
