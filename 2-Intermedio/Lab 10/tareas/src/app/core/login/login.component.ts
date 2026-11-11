import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Solo se admiten destinos internos (`/ruta`): evita redirigir a otro sitio con un `returnUrl` manipulado. */
export function destinoSeguro(returnUrl: string | null): string {
  return returnUrl !== null && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
}

/**
 * Pantalla de acceso (simulada): acepta cualquier email y contraseña, guarda un token opaco con `AuthService` y
 * vuelve a la URL que se intentó abrir (`returnUrl`) o, si no la hay, al inicio.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="card card--narrow" (submit)="entrar($event)">
      <p class="eyebrow">Acceso</p>
      <h1>Iniciar sesión</h1>
      <p class="aviso">Acceso de práctica: sirve cualquier email y contraseña.</p>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username" [value]="email()" (input)="email.set(valor($event))" />
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          [value]="password()"
          (input)="password.set(valor($event))"
        />
      </div>
      <button type="submit" class="btn btn-primary">Entrar</button>
    </form>
  `,
  styles: `
    h1 { margin: 0.4rem 0 0.6rem; color: var(--text-strong); }
    .aviso { color: var(--text-muted); margin: 0 0 1.2rem; }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly email = signal('');
  protected readonly password = signal('');

  protected entrar(evento: Event): void {
    evento.preventDefault();
    // El email y la contraseña no se comprueban en ningún sitio: la sesión es solo una simulación.
    this.auth.login(crypto.randomUUID());
    void this.router.navigateByUrl(destinoSeguro(this.route.snapshot.queryParamMap.get('returnUrl')));
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
