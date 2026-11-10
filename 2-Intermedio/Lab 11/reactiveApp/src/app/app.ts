import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Toast } from './shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast],
  template: `
    <header class="app-header">
      <div class="container header-content">
        <a class="brand" routerLink="/">Gestor de Usuarios</a>
        <nav>
          <a routerLink="/users" routerLinkActive="active">Usuarios</a>
          <a routerLink="/add-user" routerLinkActive="active">Añadir usuario</a>
          <a routerLink="/observables" routerLinkActive="active">Observables</a>
        </nav>
      </div>
    </header>

    <main class="container">
      <router-outlet />
    </main>

    <footer class="app-footer">Angular intermedio · Lab 11: programación reactiva con RxJS</footer>

    <app-toast />
  `,
  styleUrl: './app.scss',
})
export class App {}
