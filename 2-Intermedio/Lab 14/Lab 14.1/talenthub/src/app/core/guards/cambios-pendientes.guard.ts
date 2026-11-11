import { CanDeactivateFn } from '@angular/router';

/** Lo que debe ofrecer un componente para que el guard sepa si tiene cambios sin guardar. */
export interface ConCambiosPendientes {
  tieneCambiosPendientes: () => boolean;
}

/** Pide confirmación antes de salir de una pantalla con cambios sin guardar (`window.confirm`). */
export const cambiosPendientesGuard: CanDeactivateFn<ConCambiosPendientes> = (component) =>
  component.tieneCambiosPendientes() ? confirm('¿Salir sin guardar los cambios?') : true;
