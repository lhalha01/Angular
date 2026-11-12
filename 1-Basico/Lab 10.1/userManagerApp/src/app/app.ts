import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { Toast } from './shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast],
  template: `
    <header class="app-header">
      <div class="container header-content">
        <a class="brand" routerLink="/">Gestor de Usuarios</a>
        <span class="source" [class.source-local]="persistente" role="status">
          Datos: {{ persistente ? 'Backend local (se guardan los cambios)' : 'JSONPlaceholder (los cambios no se guardan)' }}
        </span>
        <nav>
          <a routerLink="/users" routerLinkActive="active">Usuarios</a>
          <a routerLink="/add-user" routerLinkActive="active">Añadir usuario</a>
        </nav>
      </div>
    </header>

    <main class="container">
      <router-outlet />
    </main>

    <footer class="app-footer">Práctica final de Angular básico · Lab 10.1</footer>

    <app-toast />
  `,
  styleUrl: './app.scss',
})
export class App {
  /** Fuente de datos elegida al arrancar (`detectBackend`); no cambia hasta recargar la página. */
  protected readonly persistente = environment.persistentApi;
}
