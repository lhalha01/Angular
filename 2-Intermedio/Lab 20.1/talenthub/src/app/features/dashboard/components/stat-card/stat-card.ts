import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tarjeta con una cifra: un título y su valor (o `—` mientras no se conoce). */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="stat">
      <p class="stat__titulo">{{ titulo() }}</p>
      <p class="stat__valor">{{ valor() ?? '—' }}</p>
    </article>
  `,
  styles: `
    .stat { padding: 1rem 1.25rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; background: #fff; }
    .stat__titulo { margin: 0; color: #475569; font-size: 0.9rem; }
    .stat__valor { margin: 0.25rem 0 0; font-size: 2rem; font-weight: 700; }
  `,
})
export class StatCard {
  readonly titulo = input.required<string>();
  /** `null` mientras se está cargando o si no se pudo obtener. */
  readonly valor = input.required<number | null>();
}
