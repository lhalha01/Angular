
import { effect, inject, Injectable, signal, DOCUMENT } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const THEMES: readonly Theme[] = ['light', 'dark'];

/**
 * Tema claro/oscuro. Se aplica como `data-theme` en <html> (los colores son variables
 * CSS en styles.css) y se recuerda en el almacenamiento local; sin preferencia guardada
 * se usa la del sistema operativo.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(StorageService);

  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.dataset['theme'] = theme;
      this.storage.set(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): Theme {
    const saved = this.storage.getOneOf(STORAGE_KEY, THEMES);
    if (saved) return saved;
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
