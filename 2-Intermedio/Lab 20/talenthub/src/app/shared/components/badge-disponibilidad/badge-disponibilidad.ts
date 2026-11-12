import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Etiqueta «Disponible» (verde) u «Ocupado» (ámbar): el color nunca es lo único que lo distingue, también el texto. */
@Component({
  selector: 'app-badge-disponibilidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class.badge--disponible]="disponible()" [class.badge--ocupado]="!disponible()">{{ disponible() ? 'Disponible' : 'Ocupado' }}</span>`,
  styles: `
    .badge { display: inline-block; padding: 0.1rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .badge--disponible { background: #dcfce7; color: #166534; }
    .badge--ocupado { background: #fef3c7; color: #92400e; }
  `,
})
export class BadgeDisponibilidad {
  readonly disponible = input.required<boolean>();
}
