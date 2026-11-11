import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Raíz de la aplicación: solo la salida del router. El armazón con navbar y footer (`Shell`) es una ruta
 * más, para que la pantalla de login pueda mostrarse sin él.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {}
