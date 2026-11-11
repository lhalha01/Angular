import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Barra de navegación de TalentHub: logo y enlaces a Directorio, Proyectos y Dashboard.
 * Las rutas de destino se definen en el Lab 13 (router); hasta entonces los enlaces no llevan a ninguna pantalla.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {}
