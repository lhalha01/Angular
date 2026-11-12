import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { destinoSeguro, Login } from './login.component';

describe('destinoSeguro', () => {
  it('admite rutas internas', () => {
    expect(destinoSeguro('/empleados/1')).toBe('/empleados/1');
    expect(destinoSeguro('/empleados?x=1')).toBe('/empleados?x=1');
  });

  it('sin destino vuelve al dashboard', () => {
    expect(destinoSeguro(null)).toBe('/dashboard');
    expect(destinoSeguro('')).toBe('/dashboard');
  });

  it('rechaza destinos externos o manipulados', () => {
    expect(destinoSeguro('https://malo.example/')).toBe('/dashboard');
    expect(destinoSeguro('//malo.example/')).toBe('/dashboard');
    expect(destinoSeguro('javascript:alert(1)')).toBe('/dashboard');
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

  function rellenarYEnviar(fixture: ReturnType<typeof TestBed.createComponent<Login>>) {
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

  it('acepta cualquier email y contraseña e inicia sesión', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    rellenarYEnviar(fixture);

    expect(TestBed.inject(AuthService).estaAutenticado()).toBeTrue();
    expect(navegar).toHaveBeenCalledOnceWith('/dashboard');
  });

  it('tras entrar vuelve a la URL de returnUrl', async () => {
    await TestBed.inject(Router).navigateByUrl('/login?returnUrl=%2Fempleados%2F1');
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    rellenarYEnviar(fixture);

    expect(navegar).toHaveBeenCalledOnceWith('/empleados/1');
  });

  it('ignora un returnUrl externo', async () => {
    await TestBed.inject(Router).navigateByUrl('/login?returnUrl=https:%2F%2Fmalo.example');
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    rellenarYEnviar(fixture);

    expect(navegar).toHaveBeenCalledOnceWith('/dashboard');
  });
});
