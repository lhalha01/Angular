
# Lab 02: Depuración en Angular

## Objetivo

Aprender a configurar y utilizar herramientas de depuración para aplicaciones Angular, incluyendo debugger del navegador, VS Code debugging, Angular DevTools y mejores prácticas para identificar y resolver problemas comunes.

## Parte 1: Configuración Inicial

### 1.1 Generar Componentes de Ejemplo

```bash
ng generate component features/counter --skip-tests
ng generate component features/user-list --skip-tests
ng generate service services/data --skip-tests
```

### 1.2 Estructura del Proyecto

```
src/app/
├── features/
│   ├── counter/
│   ├── user-list/
├── services/
│   └── data.ts
├── app.ts
├── app.config.ts
└── app.routes.ts
```

## Parte 2: Configuración de VS Code para Debugging

### 2.1 Crear Configuración de Launch

Crear archivo `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Angular App",
      "type": "chrome",
      "request": "launch",
      "preLaunchTask": "npm: start",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true,
      "trace": true,
      "smartStep": true,
      "skipFiles": ["<node_internals>/**", "node_modules/**"]
    },
    {
      "name": "Debug Angular Tests",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:9876/debug.html",
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true,
      "preLaunchTask": "npm: test"
    },
    {
      "name": "Attach to Chrome",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true
    }
  ]
}
```

### 2.2 Configurar Tasks

Crear archivo `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "npm: start",
      "type": "npm",
      "script": "start",
      "isBackground": true,
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared",
        "showReuseMessage": true,
        "clear": false
      },
      "problemMatcher": {
        "owner": "typescript",
        "pattern": "$tsc",
        "background": {
          "activeOnStart": true,
          "beginsPattern": ".*webpack.*",
          "endsPattern": ".*Application bundle generation complete.*"
        }
      }
    },
    {
      "label": "npm: test",
      "type": "npm",
      "script": "test",
      "isBackground": true,
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "npm: build",
      "type": "npm",
      "script": "build",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

### 2.3 Configuración de VS Code

Crear archivo `.vscode/settings.json`:

```json
{
  "typescript.preferences.noSemicolons": "off",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "angular.experimental-ivy": true,
  "angular.enable-strict-mode-prompt": false,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.angular": true
  }
}
```

## Parte 3: Componentes con Código para Depurar

### 3.1 Counter Component con Bugs Intencionados

**features/counter/counter.ts**:

```typescript
import { Component, signal, computed, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-counter",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="counter-container">
      <h2>Contador de Debug</h2>

      <div class="counter-display">
        <p>
          Valor actual: <strong>{{ count() }}</strong>
        </p>
        <p>
          Valor doble: <strong>{{ doubleCount() }}</strong>
        </p>
        <p>
          ¿Es par?: <strong>{{ isEven() ? "Sí" : "No" }}</strong>
        </p>
      </div>

      <div class="counter-controls">
        <button
          (click)="increment()"
          [disabled]="count() >= maxValue"
          class="btn btn-primary"
        >
          Incrementar (+1)
        </button>

        <button
          (click)="decrement()"
          [disabled]="count() <= 0"
          class="btn btn-secondary"
        >
          Decrementar (-1)
        </button>

        <button (click)="incrementBy(stepValue)" class="btn btn-info">
          Incrementar (+{{ stepValue }})
        </button>

        <button (click)="reset()" class="btn btn-warning">Reset</button>
      </div>

      <div class="step-control">
        <label for="step">Paso personalizado:</label>
        <input
          id="step"
          type="number"
          [(ngModel)]="stepValue"
          min="1"
          max="10"
          class="form-control"
        />
      </div>

      <div class="debug-info">
        <h4>Debug Info:</h4>
        <pre>{{ getDebugInfo() | json }}</pre>
      </div>

      <!-- Bug intencional: división por cero -->
      <div *ngIf="count() > 0" class="calculation">
        <p>100 dividido por count: {{ 100 / (count() - count()) }}</p>
      </div>
    </div>
  `,
  styleUrls: ["./counter.scss"],
})
export class Counter implements OnInit, OnDestroy {
  count = signal(0);
  stepValue = 1;
  maxValue = 20;

  // Bug: memoria leak con setInterval
  private intervalId?: number;

  // Computed properties
  doubleCount = computed(() => this.count() * 2);
  isEven = computed(() => this.count() % 2 === 0);

  ngOnInit(): void {
    console.log("Counter initialized");

    // Bug intencional: setInterval sin cleanup
    this.intervalId = window.setInterval(() => {
      console.log("Interval running...", this.count());
    }, 5000);

    // Debug: Log inicial
    this.debugLog("Component initialized");
  }

  ngOnDestroy(): void {
    console.log("Counter destroyed");

    // Fix del memory leak
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  increment(): void {
    this.debugLog("Incrementing count");

    if (this.count() < this.maxValue) {
      this.count.update((value) => value + 1);
    } else {
      console.warn("Maximum value reached!");
    }
  }

  decrement(): void {
    this.debugLog("Decrementing count");

    if (this.count() > 0) {
      this.count.update((value) => value - 1);
    } else {
      console.warn("Minimum value reached!");
    }
  }

  incrementBy(step: number): void {
    this.debugLog(`Incrementing by ${step}`);

    // Bug intencional: no validar el tipo
    const newValue = this.count() + step;

    if (newValue <= this.maxValue) {
      this.count.set(newValue);
    } else {
      console.error("Would exceed maximum value");
    }
  }

  reset(): void {
    this.debugLog("Resetting counter");
    this.count.set(0);
  }

  getDebugInfo(): object {
    return {
      currentValue: this.count(),
      doubleValue: this.doubleCount(),
      isEven: this.isEven(),
      stepValue: this.stepValue,
      maxValue: this.maxValue,
      timestamp: new Date().toISOString(),
    };
  }

  private debugLog(message: string): void {
    console.group(`🔍 Counter Debug`);
    console.log(`📝 ${message}`);
    console.log(`📊 Current state:`, this.getDebugInfo());
    console.trace("Stack trace");
    console.groupEnd();
  }
}
```

### 3.2 Estilos del Counter

**features/counter/counter.scss**:

```scss
.counter-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.counter-display {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;

  p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
  }

  strong {
    color: #007bff;
    font-size: 1.3rem;
  }
}

.counter-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-primary {
    background: #007bff;
    color: white;
  }

  &.btn-secondary {
    background: #6c757d;
    color: white;
  }

  &.btn-info {
    background: #17a2b8;
    color: white;
  }

  &.btn-warning {
    background: #ffc107;
    color: #212529;
  }
}

.step-control {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;

  label {
    font-weight: 500;
  }

  .form-control {
    width: 100px;
    padding: 0.5rem;
    border: 2px solid #e9ecef;
    border-radius: 4px;
    text-align: center;
  }
}

.debug-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #28a745;

  h4 {
    margin-top: 0;
    color: #495057;
  }

  pre {
    background: #ffffff;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9rem;
    border: 1px solid #dee2e6;
  }
}

.calculation {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .counter-container {
    margin: 1rem;
    padding: 1rem;
  }

  .counter-controls {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 100%;
    max-width: 200px;
  }
}
```

### 3.3 User List Component con Errores

**features/user-list/user-list.ts**:

```typescript
import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Data, User } from "../../services/data";

@Component({
  selector: "app-user-list",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-list-container">
      <h2>Lista de Usuarios</h2>

      <div class="controls">
        <button (click)="loadUsers()" class="btn btn-primary">
          Cargar Usuarios
        </button>

        <button (click)="loadUsersWithError()" class="btn btn-danger">
          Cargar con Error
        </button>

        <button (click)="clearUsers()" class="btn btn-secondary">
          Limpiar Lista
        </button>
      </div>

      <div class="search-filter">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Buscar usuarios..."
          class="form-control"
        />
      </div>

      <div class="stats">
        <p>Total usuarios: {{ users().length }}</p>
        <p>Usuarios filtrados: {{ filteredUsers().length }}</p>
        <p>Usuarios activos: {{ activeUsersCount() }}</p>
      </div>

      <div *ngIf="loading()" class="loading">
        <p>Cargando usuarios...</p>
      </div>

      <div *ngIf="error()" class="error">
        <p>Error: {{ error() }}</p>
      </div>

      <div class="user-grid">
        <div
          *ngFor="
            let user of filteredUsers();
            trackBy: trackByUserId;
            let i = index
          "
          class="user-card"
          [class.inactive]="!user.active"
        >
          <h4>{{ user.name }}</h4>
          <p>Email: {{ user.email }}</p>
          <p>Edad: {{ user.age }}</p>
          <p>Estado: {{ user.active ? "Activo" : "Inactivo" }}</p>
          <p>Índice: {{ i }}</p>

          <!-- Bug intencional: acceso a propiedad undefined -->
          <p *ngIf="user.profile">Perfil: {{ user.profile.description }}</p>

          <button
            (click)="toggleUserStatus(user)"
            class="btn btn-sm"
            [class.btn-success]="!user.active"
            [class.btn-warning]="user.active"
          >
            {{ user.active ? "Desactivar" : "Activar" }}
          </button>
        </div>
      </div>

      <div *ngIf="filteredUsers().length === 0 && !loading()" class="no-users">
        <p>No se encontraron usuarios.</p>
      </div>
    </div>
  `,
  styleUrls: ["./user-list.scss"],
})
export class UserList implements OnInit {
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = "";

  // Computed properties
  filteredUsers = computed(() => {
    const users = this.users();
    const term = this.searchTerm.toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  });

  activeUsersCount = computed(
    () => this.users().filter((user) => user.active).length
  );

  constructor(private data: Data) {}

  ngOnInit(): void {
    console.log("UserList initialized");
    this.loadUsers();
  }

  loadUsers(): void {
    console.log("Loading users...");
    this.loading.set(true);
    this.error.set(null);

    this.data.getUsers().subscribe({
      next: (users) => {
        console.log("Users loaded successfully:", users);
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("Error loading users:", error);
        this.error.set("Error al cargar usuarios");
        this.loading.set(false);
      },
    });
  }

  loadUsersWithError(): void {
    console.log("Loading users with intentional error...");
    this.loading.set(true);
    this.error.set(null);

    this.data.getUsersWithError().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("Expected error occurred:", error);
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  clearUsers(): void {
    console.log("Clearing user list");
    this.users.set([]);
    this.error.set(null);
  }

  toggleUserStatus(user: User): void {
    console.log(`Toggling status for user: ${user.name}`);

    // Bug intencional: mutar el objeto directamente
    user.active = !user.active;

    // Forzar actualización de signals
    this.users.set([...this.users()]);
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
```

### 3.4 Data  con Simulación de Errores

**services/data.ts**:

```typescript
import { Injectable } from "@angular/core";
import { Observable, of, throwError, delay } from "rxjs";

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  active: boolean;
  profile?: {
    description: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class Data {
  private mockUsers: User[] = [
    {
      id: 1,
      name: "Ana García",
      email: "ana@example.com",
      age: 28,
      active: true,
      profile: { description: "Desarrolladora Frontend" },
    },
    {
      id: 2,
      name: "Carlos López",
      email: "carlos@example.com",
      age: 35,
      active: true,
      // Bug intencional: sin profile
    },
    {
      id: 3,
      name: "María Rodríguez",
      email: "maria@example.com",
      age: 31,
      active: false,
      profile: { description: "Diseñadora UX" },
    },
    {
      id: 4,
      name: "José Martínez",
      email: "jose@example.com",
      age: 42,
      active: true,
    },
  ];

  constructor() {
    console.log("Data initialized");
  }

  getUsers(): Observable<User[]> {
    console.log("Data: Getting users...");

    // Simular delay de red
    return of([...this.mockUsers]).pipe(delay(1000));
  }

  getUsersWithError(): Observable<User[]> {
    console.log("Data: Getting users with error...");

    return throwError(() => new Error("Simulated network error")).pipe(
      delay(1000)
    );
  }

  getUserById(id: number): Observable<User | null> {
    console.log(`Data: Getting user with id ${id}`);

    const user = this.mockUsers.find((u) => u.id === id) || null;
    return of(user).pipe(delay(500));
  }

  updateUser(user: User): Observable<User> {
    console.log("Data: Updating user", user);

    const index = this.mockUsers.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.mockUsers[index] = { ...user };
      return of(this.mockUsers[index]).pipe(delay(300));
    }

    return throwError(() => new Error("User not found"));
  }
}
```

## Parte 4: Configuración de App Principal

### 4.1 App Component

**app.ts**:

```typescript
import { Component } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: "app-root",
  imports: [RouterModule],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>🔍 Angular Debug Lab</h1>
        <nav class="navigation">
          <a routerLink="/counter" routerLinkActive="active">Counter</a>
          <a routerLink="/users" routerLinkActive="active">Users</a>
          <a routerLink="/todos" routerLinkActive="active">Todos</a>
        </nav>
      </header>

      <main class="main-content">
        <router-outlet />
      </main>

      <footer class="app-footer">
        <p>Debug App - Angular {{ getAngularVersion() }}</p>
      </footer>
    </div>
  `,
  styleUrls: ["./app.scss"],
})
export class App implements OnInit {
  title = "Debug App";

  ngOnInit(): void {
    console.log("🚀 App Component initialized");
    console.log("🌍 Environment:", this.getEnvironmentInfo());

    // Debug: Información del navegador
    this.logBrowserInfo();

    // Debug: Performance timing
    this.logPerformanceInfo();
  }

  getAngularVersion(): string {
    return "17+";
  }

  private getEnvironmentInfo(): object {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }

  private logBrowserInfo(): void {
    console.group("🌐 Browser Information");
    console.log("User Agent:", navigator.userAgent);
    console.log("Language:", navigator.language);
    console.log("Platform:", navigator.platform);
    console.log("Screen:", `${screen.width}x${screen.height}`);
    console.log("Viewport:", `${window.innerWidth}x${window.innerHeight}`);
    console.groupEnd();
  }

  private logPerformanceInfo(): void {
    if ("performance" in window) {
      console.group("⚡ Performance Information");
      console.log("Navigation type:", performance.navigation?.type);
      console.log("Redirect count:", performance.navigation?.redirectCount);

      // Timing information
      const timing = performance.timing;
      if (timing) {
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime =
          timing.domContentLoadedEventEnd - timing.navigationStart;

        console.log("Page load time:", loadTime + "ms");
        console.log("DOM ready time:", domReadyTime + "ms");
      }

      console.groupEnd();
    }
  }
}
```

### 4.2 App Routes

**app.routes.ts**:

```typescript
import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/counter",
    pathMatch: "full",
  },
  {
    path: "counter",
    loadComponent: () =>
      import("./features/counter/counter").then(
        (m) => m.Counter
      ),
    title: "Counter - Debug App",
  },
  {
    path: "users",
    loadComponent: () =>
      import("./features/user-list/user-list").then(
        (m) => m.UserList
      ),
    title: "Users - Debug App",
  },
  {
    path: "**",
    redirectTo: "/counter",
  },
];
```

## Parte 5: Angular DevTools

### 5.1 Instalación

1. Instalar extensión Angular DevTools en Chrome/Edge
2. Abrir Developer Tools (F12)
3. Ir a la pestaña "Angular"

### 5.2 Uso de Angular DevTools

**Características principales:**

- **Component Explorer**: Inspeccionar jerarquía de componentes
- **Profiler**: Analizar performance de change detection
- **Injector Tree**: Ver dependencias inyectadas
- **Router Tree**: Inspeccionar rutas activas

```

## Parte 6: Debugging en Navegador

### 6.1 Breakpoints en DevTools

1. Abrir Chrome DevTools (F12)
2. Ir a Sources tab
3. Encontrar archivos TypeScript compilados
4. Establecer breakpoints en las líneas deseadas
```

## Conclusión

Has completado un laboratorio completo de debugging que incluye:

### Técnicas Aprendidas

✅ **VS Code Configuration**: Launch configs, tasks, settings
✅ **Browser DevTools**: Breakpoints, console, network
✅ **Angular DevTools**: Component inspector, profiler
✅ **Signal Debugging**: Effect tracking, state inspection
✅ **Error Handling**: Global error handler, try-catch
✅ **Performance Debugging**: Change detection, memory leaks
✅ **HTTP Debugging**: Interceptors, network analysis

### Herramientas Dominadas

- **Angular DevTools**: Inspección de componentes y performance
- **Chrome DevTools**: Debugging avanzado y profiling
- **VS Code Debugger**: Integrated debugging experience
- **Console API**: Grupos, trazas, medición de tiempo
- **Performance API**: Timing, memory usage

### Mejores Prácticas

1. **Debug Builds**: Usar source maps en desarrollo
2. **Structured Logging**: Console groups y niveles
3. **Error Boundaries**: Global error handling
4. **Performance Monitoring**: Memory y change detection

¡Ahora tienes las herramientas y conocimientos para debuggear efectivamente cualquier aplicación Angular!

## Referencias Oficiales

- [Angular DevTools Guide](https://angular.dev/tools/devtools)
- [Angular CLI Build Configuration](https://angular.dev/tools/cli/build)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Angular Performance Guide](https://angular.dev/best-practices/runtime-performance)
- [Angular Error Handling](https://angular.dev/best-practices/handling-errors)
- [Chrome DevTools Angular Guide](https://developer.chrome.com/docs/devtools/angular/)
- [VS Code Angular Debugging](https://code.visualstudio.com/docs/nodejs/angular-tutorial#_debugging-angular)
- [Angular Source Maps](https://angular.dev/tools/cli/build#source-map-configuration)
