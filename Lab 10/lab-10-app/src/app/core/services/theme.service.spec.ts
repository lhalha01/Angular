import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => localStorage.removeItem('theme'));
  afterEach(() => localStorage.removeItem('theme'));

  it('toggles between dark and light, applies data-theme and persists the choice', () => {
    const service = TestBed.inject(ThemeService);
    service.theme.set('dark');
    TestBed.flushEffects();
    expect(document.documentElement.dataset['theme']).toBe('dark');

    service.toggle();
    TestBed.flushEffects();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
