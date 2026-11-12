import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notificaciones } from '@core/layout/notificaciones/notificaciones.component';

/**
 * Raíz de la aplicación: la salida del router y la zona de avisos (notificaciones). El armazón con navbar y footer (`Shell`) es una ruta
 * más, para que la pantalla de login pueda mostrarse sin él.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Notificaciones],
  template: `
    <router-outlet />
    <app-notificaciones />
  `,
})
export class App {}
