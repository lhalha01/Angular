import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Navbar } from './navbar';

describe('Navbar', () => {
  async function crear(rutas: { path: string; children: [] }[] = []) {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter(rutas)],
    }).compileComponents();
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra el logo de TalentHub', async () => {
    const { el } = await crear();
    expect(el.querySelector('.logo')?.textContent).toContain('TalentHub');
  });

  it('enlaza al Directorio, a Proyectos y al Dashboard', async () => {
    const { el } = await crear();
    const enlaces = Array.from(el.querySelectorAll<HTMLAnchorElement>('nav a'));

    expect(enlaces.map((a) => a.textContent?.trim())).toEqual(['Directorio', 'Proyectos', 'Dashboard']);
    expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['/empleados', '/proyectos', '/dashboard']);
  });

  it('el logo lleva al dashboard y tiene un nombre accesible', async () => {
    const { el } = await crear();
    const logo = el.querySelector<HTMLAnchorElement>('.logo')!;
    expect(logo.getAttribute('href')).toBe('/dashboard');
    expect(logo.getAttribute('aria-label')).toContain('TalentHub');
  });

  it('marca como activo solo el enlace de la ruta actual', async () => {
    const { fixture, el } = await crear([
      { path: 'empleados', children: [] },
      { path: 'proyectos', children: [] },
    ]);
    await TestBed.inject(Router).navigateByUrl('/proyectos');
    fixture.detectChanges();

    const activos = Array.from(el.querySelectorAll('nav a.activo')).map((a) => a.textContent?.trim());
    expect(activos).toEqual(['Proyectos']);
  });
});
