import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell.component';

describe('Shell (armazón de las pantallas protegidas)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra el navbar, la zona de contenido y el footer, en ese orden', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(Array.from(el.children).map((c) => c.tagName.toLowerCase())).toEqual([
      'app-navbar',
      'main',
      'app-footer',
    ]);
  });

  it('pinta la pantalla de cada ruta dentro del contenido', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('main router-outlet')).not.toBeNull();
  });
});
