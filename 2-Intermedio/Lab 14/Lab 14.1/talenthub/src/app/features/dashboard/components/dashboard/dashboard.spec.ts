import { TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  it('muestra el título y anuncia lo que contendrá', async () => {
    await TestBed.configureTestingModule({ imports: [Dashboard] }).compileComponents();
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toBe('Dashboard');
    expect(el.textContent).toContain('proyectos activos');
  });
});
