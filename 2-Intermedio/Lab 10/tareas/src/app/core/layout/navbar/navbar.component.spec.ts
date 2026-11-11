import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([{ path: 'login', children: [] }])],
    }).compileComponents();
  });
  afterEach(() => sessionStorage.clear());

  function crear(conSesion: boolean) {
    if (conSesion) TestBed.inject(AuthService).login('t');
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('con sesión muestra la marca, el título del nivel, los tres enlaces y «Cerrar sesión»', () => {
    const { el } = crear(true);
    expect(el.querySelector('.brand')?.textContent).toContain('ToDo App');
    expect(el.querySelector('.level-title')?.textContent).toContain('Angular nivel intermedio');
    expect(Array.from(el.querySelectorAll('nav a')).map((a) => a.textContent?.trim())).toEqual([
      'Inicio',
      'Tareas',
      'Agregar',
    ]);
    expect(el.querySelector('.salir')?.textContent).toContain('Cerrar sesión');
  });

  it('sin sesión no muestra enlaces ni «Cerrar sesión» (solo la marca y el tema)', () => {
    const { el } = crear(false);
    expect(el.querySelector('.brand')).not.toBeNull();
    expect(el.querySelectorAll('nav a').length).toBe(0);
    expect(el.querySelector('.salir')).toBeNull();
    expect(el.querySelector('.theme-toggle')).not.toBeNull();
  });

  it('el menú aparece al iniciar sesión y desaparece al cerrarla, sin recargar', () => {
    const { fixture, el } = crear(false);
    TestBed.inject(AuthService).login('t');
    fixture.detectChanges();
    expect(el.querySelectorAll('nav a').length).toBe(3);

    TestBed.inject(AuthService).logout();
    fixture.detectChanges();
    expect(el.querySelectorAll('nav a').length).toBe(0);
  });

  it('«Cerrar sesión» elimina el token y lleva a /login', async () => {
    const { el } = crear(true);
    el.querySelector<HTMLButtonElement>('.salir')!.click();
    await TestBed.inject(Router).navigateByUrl('/login');
    expect(TestBed.inject(AuthService).estaAutenticado()).toBeFalse();
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('toggles the theme with the button', () => {
    const { el } = crear(false);
    const theme = TestBed.inject(ThemeService);
    const before = theme.theme();
    el.querySelector<HTMLButtonElement>('.theme-toggle')?.click();
    expect(theme.theme()).not.toBe(before);
  });
});
