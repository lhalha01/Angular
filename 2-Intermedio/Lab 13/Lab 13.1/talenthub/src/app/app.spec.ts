import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App (raíz de la aplicación)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se crea', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('solo contiene la salida del router (el armazón es la ruta Shell)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(Array.from(el.children).map((c) => c.tagName.toLowerCase())).toEqual(['router-outlet']);
  });
});
