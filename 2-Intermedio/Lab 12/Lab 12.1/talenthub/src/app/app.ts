import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '@core/layout/footer/footer';
import { Navbar } from '@core/layout/navbar/navbar';

/** Raíz de la aplicación: el armazón (navbar y footer) y, entre ambos, la pantalla de cada ruta. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
