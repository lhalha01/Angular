import { Component, computed, input } from '@angular/core';

/** Círculo con las iniciales de una persona (hasta dos) y un color que sale de su nombre, siempre el mismo. */
@Component({
  selector: 'app-avatar',
  template: `<span class="avatar" [style.background-color]="color()" [attr.aria-label]="nombre()" role="img">{{ iniciales() }}</span>`,
  styles: `
    .avatar {
      display: inline-flex; align-items: center; justify-content: center; flex: none;
      width: 2.25rem; height: 2.25rem; border-radius: 50%; color: #fff; font-size: 0.85rem; font-weight: 700;
      text-transform: uppercase; user-select: none;
    }
  `,
})
export class Avatar {
  readonly nombre = input.required<string>();

  protected readonly iniciales = computed(() => {
    const palabras = this.nombre().trim().split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return '?';
    const primera = palabras[0][0];
    return palabras.length === 1 ? primera : primera + palabras[palabras.length - 1][0];
  });

  /** Un color estable por nombre (mismo nombre, mismo color), con luminosidad baja para que el texto blanco se lea. */
  protected readonly color = computed(() => {
    let hash = 0;
    for (const letra of this.nombre()) hash = (hash * 31 + letra.charCodeAt(0)) % 360;
    return `hsl(${hash}, 55%, 38%)`;
  });
}
