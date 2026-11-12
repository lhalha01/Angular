import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Barra de navegación de TalentHub: logo y enlaces a Directorio, Proyectos y Dashboard.
 * Incluye «Cerrar sesión», que termina la sesión simulada y lleva a `/login` (Lab 13).
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected cerrarSesion(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
