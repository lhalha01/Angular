import { Directive, computed, input } from '@angular/core';

/**
 * Directiva de atributo: resalta con un color de fondo los elementos cuyo id es par.
 * Uso: <li [appHighlightEven]="user.id">
 */
@Directive({
  selector: '[appHighlightEven]',
  host: { '[style.background-color]': 'background()' },
})
export class HighlightEven {
  readonly appHighlightEven = input.required<number>();
  readonly color = input('#e7f1ff');

  // `null` quita el estilo, así que los ids impares conservan su fondo normal.
  protected readonly background = computed(() =>
    this.appHighlightEven() % 2 === 0 ? this.color() : null,
  );
}
