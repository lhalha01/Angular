import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@core/layout/navbar/navbar.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from '@shared/components/toast/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ToastContainerComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-navbar />

    <main class="container">
      <router-outlet />
    </main>

    <app-toast-container />
    <app-confirm-dialog />
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--page-bg); }
    .container { padding: 1rem; }
  `,
})
export class AppComponent {}
