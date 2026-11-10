import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Header } from './layout/header/header';
import { User } from './interfaces/user';
import { Footer } from './layout/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterModule, Header, Footer],
  template: `
<div class="app-container">
  <app-header
    [appTitle]="title"
    [currentUser]="currentUser()"
    (navigationClick)="onNavigation($event)"
    (loginClick)="onHeaderLogin()"
    (logoutClick)="onHeaderLogout()"
  />
  <main class="main-content">
    <router-outlet />
  </main>
  <app-footer />
</div>
  `,
  styleUrl: './app.scss',
})

export class App {
  title = 'Avanade';
  currentUser = signal<User | null>(null);

  private router = inject(Router);
  private sampleUsers: User[] = [
    { id: 1, name: 'Ana García', email: 'ana@example.com', role: 'admin' },
    { id: 2, name: 'Carlos López', email: 'carlos@example.com', role: 'user' },
    {
      id: 3,
      name: 'María Rodríguez',
      email: 'maria@example.com',
      role: 'guest',
    },
  ];

  onNavigation(section: string) {
    this.router.navigate([section]);
  }

  onHeaderLogin() {
    this.simulateLogin();
  }

  onHeaderLogout() {
    this.onLogout();
  }

  onLogout() {
    this.currentUser.set(null);
    console.log('Usuario cerró sesión');
    alert('Sesión cerrada correctamente 👋');
  }

  private simulateLogin() {
    const randomUser =
      this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)];
    this.currentUser.set(randomUser);
    console.log('Usuario autenticado:', randomUser);
    alert(`¡Bienvenido, ${randomUser.name}! 🎉`);
  }
}
