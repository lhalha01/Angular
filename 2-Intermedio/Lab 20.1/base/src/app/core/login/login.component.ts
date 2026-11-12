import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/** Solo se admiten destinos internos (`/ruta`): evita redirigir a otro sitio con un `returnUrl` manipulado. */
export function destinoSeguro(returnUrl: string | null): string {
  return returnUrl !== null && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard';
}

/**
 * Pantalla de acceso (simulada): acepta cualquier email y contraseña, inicia sesión con `AuthService` y
 * vuelve a la URL que se intentó abrir (`returnUrl`) o, si no la hay, al dashboard.
 */
@Component({
  selector: 'app-login',
  template: `
    <main class="login">
      <form (submit)="entrar($event)">
        <h1>TalentHub</h1>
        <p class="aviso">Acceso de práctica: sirve cualquier email y contraseña.</p>
        <label>
          Email
          <input name="email" type="email" autocomplete="username" [value]="email()" (input)="email.set(valor($event))" />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            autocomplete="current-password"
            [value]="password()"
            (input)="password.set(valor($event))"
          />
        </label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  `,
  styles: `
    .login { min-height: 100vh; display: grid; place-items: center; }
    form { display: grid; gap: 0.75rem; width: min(22rem, 90vw); padding: 2rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; }
    label { display: grid; gap: 0.25rem; }
    .aviso { color: #475569; margin: 0; }
    button { padding: 0.5rem 1rem; border-radius: 0.5rem; border: 0; background: #2563eb; color: #fff; cursor: pointer; }
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
    this.auth.login(this.email(), this.password());
    void this.router.navigateByUrl(destinoSeguro(this.route.snapshot.queryParamMap.get('returnUrl')));
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
