import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topnav">
      <div class="brand">ToDo App</div>
      <nav class="nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
        <a routerLink="/tasks" routerLinkActive="active">Tareas</a>
        <a routerLink="/add-task" routerLinkActive="active">Agregar</a>
      </nav>
    </header>

    <main class="container">
      <router-outlet />
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: linear-gradient(135deg, #020817 0%, #111827 35%, #1e293b 100%); }
    .topnav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid rgba(148, 163, 184, 0.15); background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px); }
    .brand { color: white; font-weight: 800; font-size: 1.25rem; }
    .nav { display: flex; gap: 1rem; flex-wrap: wrap; }
    .nav a { color: #dbeafe; text-decoration: none; padding: 0.6rem 0.8rem; border-radius: 0.7rem; }
    .nav a:hover, .nav a.active { background: rgba(59, 130, 246, 0.15); }
    .container { padding: 1rem; }
  `,
})
export class AppComponent {}
