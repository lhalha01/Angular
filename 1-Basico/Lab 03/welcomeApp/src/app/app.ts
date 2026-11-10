import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Welcome, User } from "./welcome/welcome";
import { Header } from './layout/header/header';

@Component({
  selector: "app-root",
  imports: [CommonModule, Welcome, Header],
  templateUrl: "./app.html",
  styleUrls: ["./app.scss"],
})
export class App {
  title = "Avanade";
  currentUser = signal<User | null>(null);
  showPersonalizedMessage = signal(true);

  private sampleUsers: User[] = [
    { id: 1, name: 'Ana García', email: 'ana@example.com', role: 'admin' },
    { id: 2, name: 'Carlos López', email: 'carlos@example.com', role: 'user' },
    { id: 3, name: 'María Rodríguez', email: 'maria@example.com', role: 'guest'},
  ];

  onUserInteraction(action: string) {
    console.log("Usuario realizó acción:", action);
    switch (action) {
      case "explore":
        alert("¡Explorando la aplicación! 🚀");
        break;
      case "profile":
        alert("Navegando al perfil... 👤");
        break;
      case "settings":
        alert("Abriendo configuración... ⚙️");
        break;
      case "login":
        this.simulateLogin();
        break;
    }
  }

  onLogout() {
    this.currentUser.set(null);
    console.log("Usuario cerró sesión");
    alert("Sesión cerrada correctamente 👋");
  }

  onNavigation(section: string) {
    console.log("Navegando a:", section);
    alert(`Navegando a la sección: ${section}`);
  }

  onHeaderLogin() {
    this.simulateLogin();
  }

  onHeaderLogout() {
    this.onLogout();
  }

  togglePersonalizedMessage() {
    this.showPersonalizedMessage.update((show) => !show);
  }

  private simulateLogin() {
    // Simular login con usuario aleatorio
    const randomUser =
      this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)];
    this.currentUser.set(randomUser);
    console.log("Usuario autenticado:", randomUser);
    alert(`¡Bienvenido, ${randomUser.name}! 🎉`);
  }
}
