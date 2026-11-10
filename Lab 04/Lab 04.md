
[[_TOC_]]

# Router Lab 04: Navegación en Angular

## Objetivo

Aprender a implementar un sistema de navegación completo usando el Router de Angular 17+ con enfoque en standalone components, lazy loading, guards, resolvers y las mejores prácticas modernas.

## Parte 1: Generación de Componentes

### 1.1 Generar Componentes Base

```bash
# Layout components
ng generate component layout/footer --skip-tests

# Feature components
ng generate component features/home --skip-tests
```

## Parte 2: Configuración de Rutas

### 2.1 Rutas Principales

**app.routes.ts**:

```typescript
import { Routes } from "@angular/router"
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Home - Debug App',
  },
  {
    path: 'counter',
    loadComponent: () => import('./features/counter/counter').then((m) => m.Counter),
    title: 'Counter- Debug App',
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
```

## Parte 3: Componentes

### Creación de user interface interfaces/user.ts

```bash
ng generate interface interfaces/user
```

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  active?: boolean;
  profile?: {
    description: string;
  };
  role: string;
}
```

### 3.1 App Component

```typescript
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
```

app.scss

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

### 3.2 Header Component

**layout/header/header.ts**:

```typescript
import { Component, inject, Input, Output, EventEmitter } from "@angular/core";
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
        <li><a (click)="navigate('home')">Inicio</a></li>
        <li><a (click)="navigate('counter')">Counter</a></li>
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
  styleUrls: ["./header.scss"],
})
export class Header {
  @Input() appTitle = 'Avanade';
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

header.scss

```css
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
```

## Conclusión

Has completado un sistema de routing que incluye:

### Funcionalidades Implementadas

✅ **Rutas Hijas**: Navegación anidada
✅ **Query Parameters**: Parámetros de consulta para estado
✅ **Navigation Extras**: Opciones avanzadas de navegación
✅ **Route Titles**: Títulos dinámicos para SEO

### Conceptos Modernos de Angular 17+

- **Standalone Components**: Sin necesidad de NgModules
- **Inject Function**: Inyección de dependencias moderna
- **Signals**: Estado reactivo para servicios
- **Modern Syntax**: Async/await y observables

### Mejores Prácticas

- Lazy loading para mejor rendimiento
- Guards para seguridad
- Resolvers para UX fluida
- Tipado fuerte con TypeScript
- Testing de guards y servicios

¡El routing es fundamental para SPAs complejas y ahora dominas todas sus características avanzadas!

## Referencias Oficiales

- [Angular Router Documentation](https://angular.dev/guide/routing)
- [Angular Routing Tutorial](https://angular.dev/tutorials/learn-angular/12-enable-routing)
- [Router Testing](https://angular.dev/guide/testing/components-scenarios#component-with-routerlink)
- [Navigation API](https://angular.dev/api/router/Router)
- [Standalone Components Routing](https://angular.dev/guide/routing/common-router-tasks#lazy-loading-standalone-components)
