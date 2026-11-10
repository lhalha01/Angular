import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Tema claro/oscuro. Se aplica como `data-theme` en <html> (los colores son variables
 * CSS en styles.css) y se recuerda en localStorage; sin preferencia guardada se usa la
 * del sistema operativo.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.dataset['theme'] = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Almacenamiento no disponible (modo privado, etc.): el tema solo dura la sesión.
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Se ignora: se usa la preferencia del sistema.
    }
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
