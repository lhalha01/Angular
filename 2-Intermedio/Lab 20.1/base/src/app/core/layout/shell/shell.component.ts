import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '@core/layout/footer/footer';
import { Navbar } from '@core/layout/navbar/navbar';

/**
 * Armazón de las pantallas protegidas: navbar, el contenido de la ruta y footer. La pantalla de login queda
 * fuera de él (sin menú), por eso el armazón es una ruta y no parte de `App`.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <app-navbar />
    <main class="contenido">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .contenido { flex: 1; }
  `,
})
export class Shell {}
