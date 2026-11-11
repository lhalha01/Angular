import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows the brand, the level title and the three main links', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.brand')?.textContent).toContain('ToDo App');
    expect(el.querySelector('.level-title')?.textContent).toContain('Angular nivel intermedio');
    expect(Array.from(el.querySelectorAll('nav a')).map((a) => a.textContent?.trim())).toEqual([
      'Inicio',
      'Tareas',
      'Agregar',
    ]);
  });

  it('toggles the theme with the button', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const theme = TestBed.inject(ThemeService);
    const before = theme.theme();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.theme-toggle')?.click();
    expect(theme.theme()).not.toBe(before);
  });
});
