import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from './shared/toast/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topnav">
      <div class="brand">ToDo App</div>
      <nav class="nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
        <a routerLink="/tasks" routerLinkActive="active">Tareas</a>
        <a routerLink="/add-task" routerLinkActive="active">Agregar</a>
        <button
          type="button"
          class="theme-toggle"
          (click)="themeService.toggle()"
          [attr.aria-label]="label()"
          [title]="label()"
        >
          {{ themeService.theme() === 'dark' ? '☀️ Claro' : '🌙 Oscuro' }}
        </button>
      </nav>
    </header>

    <main class="container">
      <router-outlet />
    </main>

    <app-toast-container />
    <app-confirm-dialog />
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--page-bg); }
    .topnav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid var(--border-soft); background: var(--surface-nav); backdrop-filter: blur(10px); }
    .brand { color: var(--text-strong); font-weight: 800; font-size: 1.25rem; }
    .nav { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .nav a { color: var(--nav-link); text-decoration: none; padding: 0.6rem 0.8rem; border-radius: 0.7rem; }
    .nav a:hover, .nav a.active { background: var(--nav-hover); }
    .theme-toggle { border: 1px solid var(--border); background: var(--btn-ghost-bg); color: var(--text); border-radius: 999px; padding: 0.5rem 0.9rem; cursor: pointer; font-weight: 600; }
    .theme-toggle:hover { background: var(--nav-hover); }
    .container { padding: 1rem; }
  `,
})
export class AppComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly label = computed(() =>
    this.themeService.theme() === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
  );
}
