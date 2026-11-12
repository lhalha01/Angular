import { Component, input } from '@angular/core';

/** Indicador de carga: un círculo giratorio con un texto que lo anuncia a los lectores de pantalla y a quien lo mira. */
@Component({
  selector: 'app-spinner',
  template: `
    <p class="spinner" role="status">
      <span class="spinner__rueda" aria-hidden="true"></span>
      <span class="spinner__texto">{{ texto() }}</span>
    </p>
  `,
  styles: `
    .spinner { display: inline-flex; align-items: center; gap: 0.6rem; margin: 0.75rem 0; color: #475569; }
    .spinner__rueda {
      width: 1.1rem; height: 1.1rem; border: 3px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%;
      animation: girar 0.8s linear infinite;
    }
    @keyframes girar { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner__rueda { animation-duration: 3s; } }
  `,
})
export class Spinner {
  readonly texto = input('Cargando…');
}
