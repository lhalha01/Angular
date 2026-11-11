import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render the navigation links', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual(['Inicio', 'Tareas', 'Agregar']);
  });
});
