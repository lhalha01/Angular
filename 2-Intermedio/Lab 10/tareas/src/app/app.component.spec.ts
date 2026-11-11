import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from '@core/services/auth.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });
  afterEach(() => sessionStorage.clear());

  it('should render the navigation links when there is a session', () => {
    TestBed.inject(AuthService).login('t');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual(['Inicio', 'Tareas', 'Agregar']);
  });

  it('should not render the navigation links without a session', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('nav a').length).toBe(0);
  });
});
