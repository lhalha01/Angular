
[[_TOC_]]

# Lab 03: Componentes - Welcome

## Objetivo

En este laboratorio aprenderás a crear y gestionar componentes en Angular usando las últimas funcionalidades de las versiones 17 y 18. Crearemos una aplicación de bienvenida que demuestra los conceptos fundamentales de componentes standalone, comunicación entre componentes y mejores prácticas modernas.

## Parte 1 Iniciar el Servidor de Desarrollo

```bash
ng serve
```

Visita `http://localhost:4200` para ver la aplicación base.

## Parte 2: Creando el Componente Welcome

### 2.1 Generar el Componente Welcome

```bash
ng generate component welcome --skip-tests
```

Esto creará:

- `src/app/welcome/welcome.ts`
- `src/app/welcome/welcome.html`
- `src/app/welcome/welcome.scss`

### 2.2 Implementar el Componente Welcome

**welcome.ts**:

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
}

@Component({
  selector: "app-welcome",
  imports: [CommonModule, FormsModule],
  templateUrl: "./welcome.html",
  styleUrls: ["./welcome.scss"],
})
export class Welcome {
  // Signals para estado reactivo
  currentTime = signal(new Date());
  visitCount = signal(0);

  // Props de entrada
  @Input() user: User | null = null;
  @Input() showPersonalizedMessage = true;

  // Eventos de salida
  @Output() userInteraction = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  // Computed properties
  greeting = computed(() => {
    const hour = this.currentTime().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  });

  timeString = computed(() => {
    return this.currentTime().toLocaleTimeString("es-ES");
  });

  userDisplayName = computed(() => {
    return this.user?.name || "Invitado";
  });

  constructor() {
    // Actualizar hora cada segundo
    setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    // Incrementar contador de visitas
    this.visitCount.update((count) => count + 1);
  }

  onButtonClick(action: string) {
    this.userInteraction.emit(action);

    if (action === "logout") {
      this.logout.emit();
    }
  }

  incrementVisits() {
    this.visitCount.update((count) => count + 1);
  }

  getRoleColor(): string {
    if (!this.user) return "gray";

    switch (this.user.role) {
      case "admin":
        return "red";
      case "user":
        return "blue";
      case "guest":
        return "green";
      default:
        return "gray";
    }
  }
}
```

### 2.3 Template del Componente Welcome

**welcome.html**:

```html
<div class="welcome-container">
  <div class="welcome-header">
    <h1>{{ greeting() }}, {{ userDisplayName() }}!</h1>
    <p class="time">Hora actual: {{ timeString() }}</p>
  </div>

  <div class="welcome-content">
    <!-- Mensaje personalizado condicional -->
    @if (showPersonalizedMessage && user) {
      <div class="personalized-message">
        <h2>Bienvenido de vuelta</h2>
        <p>Email: {{ user.email }}</p>
        <p>
          Rol:
          <span class="role-badge" [style.color]="getRoleColor()">
            {{ user.role | titlecase }}
          </span>
        </p>
      </div>
    }

    <!-- Mensaje para invitados -->
    @if (!user) {
      <div class="guest-message">
        <h2>¡Bienvenido!</h2>
        <p>Parece que eres nuevo aquí. ¡Nos alegra tenerte!</p>
      </div>
    }

    <!-- Contador de visitas -->
    <div class="visit-counter">
      <p>
        Visitas en esta sesión:
        <strong>{{ visitCount() }}</strong>
      </p>
      <button (click)="incrementVisits()" class="btn btn-secondary">
        Incrementar contador
      </button>
    </div>

    <!-- Acciones disponibles -->
    <div class="actions">
      <h3>¿Qué te gustaría hacer?</h3>

      <div class="action-buttons">
        <button (click)="onButtonClick('explore')" class="btn btn-primary">
          Explorar la aplicación
        </button>

        <button
          (click)="onButtonClick('profile')"
          class="btn btn-info"
          [disabled]="!user"
        >
          Ver perfil
        </button>

        <button
          (click)="onButtonClick('settings')"
          class="btn btn-warning"
          [disabled]="!user"
        >
          Configuración
        </button>

        @if (user) {
          <button
            (click)="onButtonClick('logout')"
            class="btn btn-danger"
          >
            Cerrar sesión
          </button>
        }

        @if (!user) {
          <button
            (click)="onButtonClick('login')"
            class="btn btn-success"
          >
            Iniciar sesión
          </button>
        }
      </div>
    </div>
  </div>
</div>
```

### 2.4 Estilos del Componente Welcome

**welcome.scss**:

```scss
.welcome-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.welcome-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.welcome-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.time {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.personalized-message,
.guest-message {
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
}

.personalized-message h2,
.guest-message h2 {
  margin-top: 0;
  color: #007bff;
}

.role-badge {
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.1);
}

.visit-counter {
  padding: 1rem;
  background-color: #e9ecef;
  border-radius: 8px;
  text-align: center;
}

.visit-counter p {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.actions {
  padding: 1.5rem;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  text-align: center;
}

.actions h3 {
  margin-top: 0;
  color: #495057;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .welcome-container {
    padding: 1rem;
  }

  .welcome-header h1 {
    font-size: 2rem;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 100%;
    max-width: 250px;
  }
}
```

## Parte 3: Crear Componente Header

### 3.1 Generar el Componente Header

```bash
ng generate component layout/header --skip-tests
```

### 3.2 Implementar el Header

**header.ts**:

```typescript
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-header",
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <h1>{{ appTitle }}</h1>
        </div>

        <nav class="navigation">
          <ul>
            <li><a href="#" (click)="navigate('home')">Inicio</a></li>
            <li><a href="#" (click)="navigate('about')">Acerca de</a></li>
            <li><a href="#" (click)="navigate('contact')">Contacto</a></li>
          </ul>
        </nav>

        <div class="user-actions">
          <span *ngIf="currentUser" class="user-name">
            Hola, {{ currentUser.name }}
          </span>
          <button *ngIf="!currentUser" (click)="login()" class="btn-login">
            Iniciar Sesión
          </button>
          <button *ngIf="currentUser" (click)="logout()" class="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .app-header {
        background: linear-gradient(90deg, #2c3e50, #3498db);
        color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 300;
      }

      .navigation ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        gap: 2rem;
      }

      .navigation a {
        color: white;
        text-decoration: none;
        font-weight: 500;
        transition: opacity 0.3s;
      }

      .navigation a:hover {
        opacity: 0.8;
      }

      .user-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-name {
        font-weight: 500;
      }

      .btn-login,
      .btn-logout {
        padding: 0.5rem 1rem;
        border: 2px solid white;
        background: transparent;
        color: white;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .btn-login:hover,
      .btn-logout:hover {
        background: white;
        color: #2c3e50;
      }

      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }

        .navigation ul {
          justify-content: center;
        }
      }
    `,
  ],
})
export class Header {
  @Input() appTitle = "Welcome App";
  @Input() currentUser: any = null;

  @Output() navigationClick = new EventEmitter<string>();
  @Output() loginClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  navigate(section: string) {
    this.navigationClick.emit(section);
  }

  login() {
    this.loginClick.emit();
  }

  logout() {
    this.logoutClick.emit();
  }
}
```

## Parte 4: Integrar Componentes en App

### 4.1 Actualizar App Component

**app.ts**:

```typescript
import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { Welcome, User } from "./welcome/welcome";
import { Header } from './layout/header/header';

@Component({
  selector: "app-root",
  imports: [CommonModule, RouterOutlet, Welcome, Header],
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
    { id: 3, name: 'María Rodríguez', email: 'maria@example.com', role: 'guest'},
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
```

### 4.2 Template Principal

**app.html**:

```html
<div class="app-container">
  <!-- Header Component -->
  <app-header
    [appTitle]="title"
    [currentUser]="currentUser()"
    (navigationClick)="onNavigation($event)"
    (loginClick)="onHeaderLogin()"
    (logoutClick)="onHeaderLogout()"
  ></app-header>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Welcome Component -->
    <app-welcome
      [user]="currentUser()"
      [showPersonalizedMessage]="showPersonalizedMessage()"
      (userInteraction)="onUserInteraction($event)"
      (logout)="onLogout()"
    ></app-welcome>

    <!-- Controls Section -->
    <section class="controls-section">
      <h3>Controles de Demostración</h3>

      <div class="control-group">
        <label>
          <input
            type="checkbox"
            [checked]="showPersonalizedMessage()"
            (change)="togglePersonalizedMessage()"
          />
          Mostrar mensaje personalizado
        </label>
      </div>

      <div class="control-group">
        <h4>Estado Actual:</h4>
        <ul>
          <li>Usuario: {{ currentUser()?.name || 'No autenticado' }}</li>
          <li>Rol: {{ currentUser()?.role || 'N/A' }}</li>
          <li>
            Mensaje personalizado: {{ showPersonalizedMessage() ? 'Activo' :
            'Inactivo' }}
          </li>
        </ul>
      </div>
    </section>
  </main>
</div>
```

### 4.3 Estilos Principales

**app.scss**:

```css
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem 0;
  background-color: #f8f9fa;
}

.controls-section {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.controls-section h3 {
  margin-top: 0;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.control-group {
  margin: 1.5rem 0;
}

.control-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.control-group input[type="checkbox"] {
  transform: scale(1.2);
}

.control-group h4 {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
}

.control-group ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #495057;
}

.control-group li {
  margin: 0.25rem 0;
}

.app-footer {
  background-color: #343a40;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

.app-footer p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0;
  }

  .controls-section {
    margin: 1rem;
    padding: 1rem;
  }
}
```

### Conceptos Clave

- ✅ **Standalone Components**: Arquitectura moderna sin NgModules
- ✅ **Signals**: Manejo de estado reactivo
- ✅ **Component Communication**: Input/Output properties
- ✅ **Event Handling**: Gestión de eventos del usuario
- ✅ **Computed Properties**: Valores derivados reactivos
- ✅ **Lifecycle Hooks**: Constructor y OnInit

### Mejores Prácticas Aplicadas

- Componentes reutilizables y modulares
- Separación clara de responsabilidades
- Tipado fuerte con TypeScript
- Responsive design
- Manejo de estado con signals

### Próximos Pasos

- Implementar lazy loading
- Añadir animaciones
- Integrar con APIs REST
- Implementar guards de ruta
- Añadir internacionalización (i18n)

¡Felicidades! Has completado exitosamente el laboratorio de componentes Welcome.

## Referencias Oficiales

- [Angular Components Documentation](https://angular.dev/guide/components)
- [Standalone Components Guide](https://angular.dev/guide/components/standalone-components)
- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [Component Communication](https://angular.dev/guide/components/inputs)
- [Angular CLI Component Generation](https://angular.dev/cli/generate#component)
- [Component Lifecycle](https://angular.dev/guide/components/lifecycle)
- [Event Handling in Angular](https://angular.dev/guide/templates/event-listeners)
