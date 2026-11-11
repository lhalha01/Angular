import { computed, Directive, input } from '@angular/core';

/**
 * Resalta el elemento cuando el nombre de usuario empieza por vocal (A, E, I, O, U),
 * con o sin tilde. El estilo de `.user-highlight` está en styles.css.
 */
@Directive({
  selector: '[appHighlightUser]',
  host: {
    '[class.user-highlight]': 'highlighted()',
    '[attr.title]': 'highlighted() ? "Usuario destacado" : null',
  },
})
export class HighlightUserDirective {
  readonly appHighlightUser = input('');

  protected readonly highlighted = computed(() =>
    // NFD separa la tilde de la letra base, de modo que "Álvaro" también cuenta.
    /^[aeiou]/i.test(this.appHighlightUser().trim().normalize('NFD')),
  );
}
