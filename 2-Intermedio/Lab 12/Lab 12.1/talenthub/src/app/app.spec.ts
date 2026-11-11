import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App (armazón de la aplicación)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se crea', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('muestra el navbar, la zona de contenido y el footer, en ese orden', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(Array.from(el.children).map((c) => c.tagName.toLowerCase())).toEqual([
      'app-navbar',
      'main',
      'app-footer',
    ]);
  });

  it('pinta la pantalla de cada ruta dentro del contenido', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('main router-outlet')).not.toBeNull();
  });
});
