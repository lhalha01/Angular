import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';

/** Lo que debe ofrecer un componente para poder usar `unsavedChangesGuard`. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Guard `canDeactivate`: si el componente tiene cambios sin guardar, pregunta antes de
 * dejar salir de la ruta (enlace, botón Cancelar o botones atrás/adelante del navegador).
 * Si el usuario elige "Seguir editando", la navegación se cancela y todo queda como estaba.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  inject(ConfirmService).ask({
    title: 'Cambios sin guardar',
    message: 'Si sales ahora, se perderán los cambios del formulario.',
    confirmLabel: 'Salir sin guardar',
    cancelLabel: 'Seguir editando',
    danger: true,
  });
