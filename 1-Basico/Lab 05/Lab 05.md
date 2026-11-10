
[[_TOC_]]

# Lab 05: Directivas Modernas con Angular 20+

Este laboratorio te enseñará a usar las nuevas directivas de control de flujo de Angular con sintaxis moderna.

### 1. Crear estructura de componentes

```bash
# Crear componentes standalone para cada directiva
ng generate component features/directives --skip-tests
ng generate component components/control-flow --skip-tests
ng generate component components/directives-attribute --skip-tests
```

### 2. Configurar el componente principal

**directives.ts**:

```typescript
import { Component } from '@angular/core';
import { ControlFlow } from '../../components/control-flow/control-flow';
import { DirectivesAttribute } from '../../components/directives-attribute/directives-attribute';
import { CommonModule } from '@angular/common';
  
@Component({
  selector: 'app-directives',
  imports: [CommonModule, ControlFlow, DirectivesAttribute],
  template: `
<div class="container">
  <header>
    <h1>{{ title }}</h1>
    <p>Aprendiendo las nuevas directivas de Angular 18+</p>
  </header>
  <nav class="navigation">
    <button
      *ngFor="let tab of tabs; let i = index"
      (click)="activeTab = i"
      [class.active]="activeTab === i"
    >
      {{ tab }}
    </button>

  </nav>
  <main>
    @switch (activeTab) { @case (0) {
    <app-control-flow />
    } @case (1) {
    <app-directives-attribute />
    } }
  </main>
</div>
  `,
  styleUrl: './directives.scss',
})
export class Directives {
  title = 'Directivas Modernas Angular';
  activeTab = 0;
  tabs = ['Control de Flujo', 'Directivas de Atributo'];
}
```

directives.scss

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}
  
header h1 {
  color: #dd0031;
  margin-bottom: 0.5rem;
}

header p {
  color: #666;
  font-size: 1.1rem;
}

.navigation {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}
  
.navigation button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #dd0031;
  background-color: white;
  color: #dd0031;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}
  
.navigation button:hover {
  background-color: #dd0031;
  color: white;
}

.navigation button.active {
  background-color: #dd0031;
  color: white;
}

main {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  min-height: 500px;
}
```

## Componente de Control de Flujo

**control-flow.ts**:

```typescript
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  disponible: boolean;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "user" | "guest";
  activo: boolean;
}

@Component({
  selector: "app-control-flow",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="control-flow-examples">
      <h2>Directivas de Control de Flujo (if, for, switch)</h2>

      <!-- Ejemplo de @if -->
      <section class="example-section">
        <h3>1. Directiva if</h3>

        <div class="controls">
          <label>
            <input type="checkbox" [(ngModel)]="mostrarBienvenida" />
            Mostrar mensaje de bienvenida
          </label>
        </div>

        @if (mostrarBienvenida) {
        <div class="welcome-message">
          <h4>¡Bienvenido a Angular!</h4>
          <p>Este mensaje se muestra cuando la condición es verdadera.</p>
        </div>
        } @else {
        <div class="info-message">
          <p>Activa el checkbox para ver el mensaje de bienvenida.</p>
        </div>
        }

        <!-- @if con múltiples condiciones -->
        <div class="controls">
          <input
            type="number"
            [(ngModel)]="puntuacion"
            placeholder="Puntuación (0-100)"
            min="0"
            max="100"
          />
        </div>

        @if (puntuacion >= 90) {
        <div class="badge excellent">Excelente</div>
        } @else if (puntuacion >= 70) {
        <div class="badge good">Bueno</div>
        } @else if (puntuacion >= 50) {
        <div class="badge average">Regular</div>
        } @else if (puntuacion > 0) {
        <div class="badge poor">Necesita mejorar</div>
        } @else {
        <div class="badge neutral">Sin puntuación</div>
        }
      </section>

      <!-- Ejemplo de @for -->
      <section class="example-section">
        <h3>2. Directiva for</h3>

        <div class="controls">
          <button (click)="agregarProducto()">Agregar Producto</button>
          <button
            (click)="eliminarUltimoProducto()"
            [disabled]="productos.length === 0"
          >
            Eliminar Último
          </button>
          <select [(ngModel)]="filtroCategoria">
            <option value="">Todas las categorías</option>
            <option value="electronicos">Electrónicos</option>
            <option value="ropa">Ropa</option>
            <option value="hogar">Hogar</option>
          </select>
        </div>

        <div class="products-grid">
          @for (producto of productosFiltrados; track producto.id; let i =
          $index; let isFirst = $first; let isLast = $last) {
          <div
            class="product-card"
            [class.first]="isFirst"
            [class.last]="isLast"
          >
            <div class="product-header">
              <h4>{{ producto.nombre }}</h4>
              <span class="product-number">#{{ i + 1 }}</span>
            </div>
            <p class="price">
              {{ producto.precio | currency : "EUR" : "symbol" : "1.2-2" }}
            </p>
            <p class="category">{{ producto.categoria }}</p>
            <div class="status">
              @if (producto.disponible) {
              <span class="available">Disponible</span>
              } @else {
              <span class="unavailable">Agotado</span>
              }
            </div>
            <button (click)="toggleDisponibilidad(producto)" class="toggle-btn">
              {{ producto.disponible ? "Marcar agotado" : "Marcar disponible" }}
            </button>
          </div>
          } @empty {
          <div class="empty-state">
            <p>No hay productos para mostrar</p>
            @if (filtroCategoria) {
            <p>Prueba cambiando el filtro de categoría</p>
            }
          </div>
          }
        </div>
      </section>

      <!-- Ejemplo de @switch -->
      <section class="example-section">
        <h3>3. Directiva switch</h3>

        <div class="controls">
          <label>Seleccionar usuario:</label>
          <select [(ngModel)]="usuarioSeleccionado">
            <option [value]="null">Ninguno</option>
            @for (usuario of usuarios; track usuario.id) {
            <option [ngValue]="usuario">{{ usuario.nombre }}</option>
            }
          </select>
        </div>

        @if (usuarioSeleccionado) {
        <div class="user-panel">
          @switch (usuarioSeleccionado.rol) { @case ('admin') {
          <div class="admin-panel">
            <h4>Panel de Administrador</h4>
            <p>Bienvenido, {{ usuarioSeleccionado.nombre }}</p>
            <ul>
              <li>Gestionar usuarios</li>
              <li>Configurar sistema</li>
              <li>Ver reportes</li>
              <li>Gestionar contenido</li>
            </ul>
          </div>
          } @case ('user') {
          <div class="user-panel-content">
            <h4>Panel de Usuario</h4>
            <p>Bienvenido, {{ usuarioSeleccionado.nombre }}</p>
            <ul>
              <li>Ver perfil</li>
              <li>Editar configuración</li>
              <li>Ver historial</li>
            </ul>
          </div>
          } @case ('guest') {
          <div class="guest-panel">
            <h4>Acceso de Invitado</h4>
            <p>Hola, {{ usuarioSeleccionado.nombre }}</p>
            <ul>
              <li>Ver contenido público</li>
              <li>Registrarse</li>
            </ul>
          </div>
          } @default {
          <div class="unknown-panel">
            <h4>Rol desconocido</h4>
            <p>No se puede determinar el nivel de acceso</p>
          </div>
          } } @if (!usuarioSeleccionado.activo) {
          <div class="warning">⚠️ Este usuario está inactivo</div>
          }
        </div>
        } @else {
        <div class="no-user">
          <p>Selecciona un usuario para ver su panel</p>
        </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .control-flow-examples {
        padding: 1rem;
      }

      .example-section {
        margin: 2rem 0;
        padding: 1.5rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: white;
      }

      .example-section h3 {
        color: #dd0031;
        margin-top: 0;
        border-bottom: 2px solid #dd0031;
        padding-bottom: 0.5rem;
      }

      .controls {
        margin: 1rem 0;
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 6px;
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .controls input,
      .controls select,
      .controls button {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .controls button {
        background-color: #007bff;
        color: white;
        border: none;
        cursor: pointer;
      }

      .controls button:hover:not(:disabled) {
        background-color: #0056b3;
      }

      .controls button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      .welcome-message {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
      }

      .info-message {
        background-color: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
      }

      .badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        margin: 1rem 0;
      }

      .badge.excellent {
        background-color: #28a745;
        color: white;
      }
      .badge.good {
        background-color: #17a2b8;
        color: white;
      }
      .badge.average {
        background-color: #ffc107;
        color: black;
      }
      .badge.poor {
        background-color: #dc3545;
        color: white;
      }
      .badge.neutral {
        background-color: #6c757d;
        color: white;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }

      .product-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1rem;
        background-color: white;
        transition: transform 0.2s;
      }

      .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .product-card.first {
        border-color: #28a745;
        border-width: 2px;
      }

      .product-card.last {
        border-color: #dc3545;
        border-width: 2px;
      }

      .product-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .product-header h4 {
        margin: 0;
        color: #333;
      }

      .product-number {
        background-color: #007bff;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
      }

      .price {
        font-size: 1.2rem;
        font-weight: bold;
        color: #28a745;
        margin: 0.5rem 0;
      }

      .category {
        color: #666;
        font-style: italic;
        margin: 0.5rem 0;
      }

      .status .available {
        color: #28a745;
        font-weight: bold;
      }

      .status .unavailable {
        color: #dc3545;
        font-weight: bold;
      }

      .toggle-btn {
        width: 100%;
        padding: 0.5rem;
        border: none;
        border-radius: 4px;
        background-color: #6c757d;
        color: white;
        cursor: pointer;
        margin-top: 1rem;
      }

      .toggle-btn:hover {
        background-color: #545b62;
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem;
        color: #666;
        background-color: #f8f9fa;
        border-radius: 8px;
      }

      .user-panel {
        margin: 1rem 0;
        padding: 1rem;
        border-radius: 8px;
      }

      .admin-panel {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
      }

      .user-panel-content {
        background-color: #e7f3ff;
        border: 1px solid #b3d7ff;
      }

      .guest-panel {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
      }

      .unknown-panel {
        background-color: #f5c6cb;
        border: 1px solid #f1b0b7;
      }

      .user-panel h4 {
        margin-top: 0;
        color: #333;
      }

      .user-panel ul {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }

      .warning {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 0.75rem;
        border-radius: 4px;
        margin-top: 1rem;
        font-weight: bold;
      }

      .no-user {
        text-align: center;
        padding: 2rem;
        color: #666;
        background-color: #f8f9fa;
        border-radius: 8px;
        margin: 1rem 0;
      }
    `,
  ],
})
export class ControlFlow {
  mostrarBienvenida = false;
  puntuacion = 0;
  filtroCategoria = "";
  usuarioSeleccionado: Usuario | null = null;

  productos: Producto[] = [
    {
      id: 1,
      nombre: "Laptop Gaming",
      precio: 1299.99,
      categoria: "electronicos",
      disponible: true,
    },
    {
      id: 2,
      nombre: "Camiseta Angular",
      precio: 25.99,
      categoria: "ropa",
      disponible: true,
    },
    {
      id: 3,
      nombre: "Lámpara LED",
      precio: 89.99,
      categoria: "hogar",
      disponible: false,
    },
    {
      id: 4,
      nombre: "Smartphone",
      precio: 699.99,
      categoria: "electronicos",
      disponible: true,
    },
  ];

  usuarios: Usuario[] = [
    {
      id: 1,
      nombre: "Ana García",
      email: "ana@email.com",
      rol: "admin",
      activo: true,
    },
    {
      id: 2,
      nombre: "Carlos López",
      email: "carlos@email.com",
      rol: "user",
      activo: true,
    },
    {
      id: 3,
      nombre: "María Rodríguez",
      email: "maria@email.com",
      rol: "guest",
      activo: false,
    },
    {
      id: 4,
      nombre: "Juan Pérez",
      email: "juan@email.com",
      rol: "user",
      activo: true,
    },
  ];

  get productosFiltrados(): Producto[] {
    if (!this.filtroCategoria) {
      return this.productos;
    }
    return this.productos.filter((p) => p.categoria === this.filtroCategoria);
  }

  agregarProducto(): void {
    const nuevosProductos = [
      { nombre: "Tablet", categoria: "electronicos", precio: 299.99 },
      { nombre: "Jeans", categoria: "ropa", precio: 79.99 },
      { nombre: "Sofá", categoria: "hogar", precio: 899.99 },
      { nombre: "Auriculares", categoria: "electronicos", precio: 159.99 },
    ];

    const producto =
      nuevosProductos[Math.floor(Math.random() * nuevosProductos.length)];
    const nuevoId = Math.max(...this.productos.map((p) => p.id)) + 1;

    this.productos.push({
      id: nuevoId,
      ...producto,
      disponible: Math.random() > 0.3,
    });
  }

  eliminarUltimoProducto(): void {
    this.productos.pop();
  }

  toggleDisponibilidad(producto: Producto): void {
    producto.disponible = !producto.disponible;
  }
}
```

## Directivas de Atributo

**directives-attribute.ts**:

```typescript
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-directives-attribute",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="directivas-atributo">
      <h2>Directivas de Atributo (ngClass, ngStyle)</h2>

      <!-- ngClass Examples -->
      <section class="example-section">
        <h3>1. Directiva ngClass</h3>

        <div class="controls">
          <label>
            <input type="checkbox" [(ngModel)]="esDestacado" />
            Destacado
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="esUrgente" />
            Urgente
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="esCompleto" />
            Completo
          </label>
          <select [(ngModel)]="temaSeleccionado">
            <option value="claro">Tema Claro</option>
            <option value="oscuro">Tema Oscuro</option>
            <option value="colorido">Tema Colorido</option>
          </select>
        </div>

        <!-- ngClass con objeto -->
        <div
          class="demo-card"
          [ngClass]="{
            destacado: esDestacado,
            urgente: esUrgente,
            completo: esCompleto,
            'tema-claro': temaSeleccionado === 'claro',
            'tema-oscuro': temaSeleccionado === 'oscuro',
            'tema-colorido': temaSeleccionado === 'colorido'
          }"
        >
          <h4>Tarjeta con ngClass (objeto)</h4>
          <p>
            Esta tarjeta cambia de apariencia según las opciones seleccionadas.
          </p>
          <p>Estado actual: {{ obtenerEstado() }}</p>
        </div>

        <!-- ngClass con array -->
        <div class="demo-card" [ngClass]="obtenerClasesArray()">
          <h4>Tarjeta con ngClass (array)</h4>
          <p>Esta tarjeta usa un array de clases generado dinámicamente.</p>
        </div>

        <!-- ngClass con string -->
        <div class="demo-card" [ngClass]="obtenerClasesString()">
          <h4>Tarjeta con ngClass (string)</h4>
          <p>Esta tarjeta usa una cadena de clases.</p>
        </div>
      </section>

      <!-- ngStyle Examples -->
      <section class="example-section">
        <h3>2. Directiva ngStyle</h3>

        <div class="controls">
          <label>Color de fondo:</label>
          <input type="color" [(ngModel)]="colorFondo" />

          <label>Color de texto:</label>
          <input type="color" [(ngModel)]="colorTexto" />

          <label>Tamaño de fuente:</label>
          <input type="range" [(ngModel)]="tamanoFuente" min="12" max="32" />
          <span>{{ tamanoFuente }}px</span>

          <label>Ancho:</label>
          <input type="range" [(ngModel)]="anchoElemento" min="200" max="600" />
          <span>{{ anchoElemento }}px</span>

          <label>
            <input type="checkbox" [(ngModel)]="conSombra" />
            Con sombra
          </label>
        </div>

        <!-- ngStyle con objeto -->
        <div
          class="demo-card"
          [ngStyle]="{
            'background-color': colorFondo,
            color: colorTexto,
            'font-size.px': tamanoFuente,
            'width.px': anchoElemento,
            'box-shadow': conSombra ? '0 4px 8px rgba(0,0,0,0.3)' : 'none',
            transition: 'all 0.3s ease',
            transform: conSombra ? 'translateY(-2px)' : 'none'
          }"
        >
          <h4>Tarjeta con ngStyle</h4>
          <p>Esta tarjeta cambia de estilo dinámicamente.</p>
          <p>Personaliza su apariencia con los controles de arriba.</p>
        </div>

        <!-- Barra de progreso con ngStyle -->
        <div class="progress-section">
          <h4>Barra de Progreso Dinámica</h4>
          <input type="range" [(ngModel)]="progreso" min="0" max="100" />
          <span>{{ progreso }}%</span>

          <div class="progress-container">
            <div
              class="progress-bar"
              [ngStyle]="{
                width: progreso + '%',
                'background-color': obtenerColorProgreso(progreso),
                transition: 'all 0.5s ease-in-out'
              }"
            ></div>
          </div>
        </div>
      </section>

      <!-- Ejemplo combinado -->
      <section class="example-section">
        <h3>3. Combinando ngClass y ngStyle</h3>

        <div class="controls">
          <button (click)="generarEstiloAleatorio()">
            Generar Estilo Aleatorio
          </button>
          <button (click)="resetearEstilos()">Resetear</button>
        </div>

        @for (item of elementosDinamicos; track item.id; let i = $index) {
        <div
          class="demo-card dynamic-item"
          [ngClass]="item.clases"
          [ngStyle]="item.estilos"
          (click)="toggleItemActivo(item)"
        >
          <h4>Elemento {{ i + 1 }}</h4>
          <p>ID: {{ item.id }}</p>
          <p>Estado: {{ item.activo ? "Activo" : "Inactivo" }}</p>
          <small>Click para activar/desactivar</small>
        </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .directivas-atributo {
        padding: 1rem;
      }

      .example-section {
        margin: 2rem 0;
        padding: 1.5rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: white;
      }

      .example-section h3 {
        color: #dd0031;
        margin-top: 0;
        border-bottom: 2px solid #dd0031;
        padding-bottom: 0.5rem;
      }

      .controls {
        margin: 1rem 0;
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 6px;
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .controls label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: bold;
      }

      .controls input,
      .controls select {
        padding: 0.25rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .controls button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background-color: #007bff;
        color: white;
        cursor: pointer;
      }

      .controls button:hover {
        background-color: #0056b3;
      }

      .demo-card {
        margin: 1rem 0;
        padding: 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        background-color: white;
        transition: all 0.3s ease;
      }

      .demo-card h4 {
        margin-top: 0;
        color: #333;
      }

      /* Clases para ngClass */
      .destacado {
        border-color: #ffc107 !important;
        background-color: #fff3cd !important;
      }

      .urgente {
        border-color: #dc3545 !important;
        background-color: #f8d7da !important;
      }

      .completo {
        border-color: #28a745 !important;
        background-color: #d4edda !important;
      }

      .tema-claro {
        background-color: #ffffff !important;
        color: #333333 !important;
      }

      .tema-oscuro {
        background-color: #343a40 !important;
        color: #ffffff !important;
      }

      .tema-colorido {
        background: linear-gradient(
          45deg,
          #ff6b6b,
          #4ecdc4,
          #45b7d1,
          #96ceb4
        ) !important;
        color: white !important;
      }

      .progress-section {
        margin: 2rem 0;
      }

      .progress-container {
        width: 100%;
        height: 30px;
        background-color: #e9ecef;
        border-radius: 15px;
        overflow: hidden;
        margin: 1rem 0;
      }

      .progress-bar {
        height: 100%;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }

      .dynamic-item {
        cursor: pointer;
        user-select: none;
        display: inline-block;
        margin: 0.5rem;
        min-width: 200px;
      }

      .dynamic-item:hover {
        transform: scale(1.05);
      }

      .activo-item {
        box-shadow: 0 0 20px rgba(40, 167, 69, 0.5) !important;
      }

      .inactivo-item {
        opacity: 0.6;
      }
    `,
  ],
})
export class DirectivesAttribute {
  esDestacado = false;
  esUrgente = false;
  esCompleto = false;
  temaSeleccionado = "claro";

  colorFondo = "#ffffff";
  colorTexto = "#333333";
  tamanoFuente = 16;
  anchoElemento = 400;
  conSombra = false;
  progreso = 50;

  elementosDinamicos = [
    { id: 1, activo: false, clases: {}, estilos: {} },
    { id: 2, activo: false, clases: {}, estilos: {} },
    { id: 3, activo: false, clases: {}, estilos: {} },
  ];

  obtenerEstado(): string {
    const estados = [];
    if (this.esDestacado) estados.push("Destacado");
    if (this.esUrgente) estados.push("Urgente");
    if (this.esCompleto) estados.push("Completo");
    return estados.length > 0 ? estados.join(", ") : "Normal";
  }

  obtenerClasesArray(): string[] {
    const clases = ["demo-card"];
    if (this.esDestacado) clases.push("destacado");
    if (this.esUrgente) clases.push("urgente");
    return clases;
  }

  obtenerClasesString(): string {
    let clases = "demo-card";
    if (this.esCompleto) clases += " completo";
    if (this.temaSeleccionado) clases += ` tema-${this.temaSeleccionado}`;
    return clases;
  }

  obtenerColorProgreso(valor: number): string {
    if (valor < 25) return "#dc3545";
    if (valor < 50) return "#fd7e14";
    if (valor < 75) return "#ffc107";
    return "#28a745";
  }

  generarEstiloAleatorio(): void {
    const colores = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
    ];
    const fondos = ["#f8f9fa", "#e9ecef", "#dee2e6", "#ced4da"];

    this.elementosDinamicos.forEach((item) => {
      const colorAleatorio =
        colores[Math.floor(Math.random() * colores.length)];
      const fondoAleatorio = fondos[Math.floor(Math.random() * fondos.length)];
      const tamanoAleatorio = Math.floor(Math.random() * 8) + 14;

      item.clases = {
        "activo-item": item.activo,
        "inactivo-item": !item.activo,
      };

      item.estilos = {
        "background-color": fondoAleatorio,
        color: colorAleatorio,
        "font-size": tamanoAleatorio + "px",
        "border-radius": Math.floor(Math.random() * 20) + 5 + "px",
        transform: `rotate(${Math.floor(Math.random() * 10) - 5}deg)`,
      };
    });
  }

  resetearEstilos(): void {
    this.elementosDinamicos.forEach((item) => {
      item.clases = {};
      item.estilos = {};
      item.activo = false;
    });
  }

  toggleItemActivo(item: any): void {
    item.activo = !item.activo;
    // Actualizar clases cuando cambia el estado
    this.generarEstiloAleatorio();
  }
}
```

### 3. Configurar la nueva navegación

Añadir en app.routes.ts la nueva navegación:

```javascript
  {
    path: 'directives',
    loadComponent: () =>
      import('./features/directives/directives').then((m) => m.Directives),
    title: 'Directives',
  },
```

Añadir en header.ts, dentro del template, la navegación a directivas:

```html
    <nav class="navigation">
      <ul>
        <li><a (click)="navigate('home')">Inicio</a></li>
        <li><a (click)="navigate('counter')">Counter</a></li>
        <li><a (click)="navigate('users')">Users</a></li>
        <li><a (click)="navigate('directives')">Directivas</a></li>
      </ul>
    </nav>
```

### 4. Iniciar la aplicación

```bash
ng serve
```

Navega a `http://localhost:4200/` para ver todos los ejemplos de directivas modernas en acción.

## Puntos Clave del Laboratorio

1. **@if**: Renderizado condicional con sintaxis moderna
2. **@for**: Iteración con track, variables contextuales y @empty
3. **@switch**: Selección múltiple con @case y @default
4. **ngClass**: Aplicación dinámica de clases CSS
5. **ngStyle**: Aplicación dinámica de estilos inline

## Ejercicios Adicionales

1. Crear un sistema de filtros avanzados usando @if y @for
2. Implementar un dashboard con diferentes widgets usando @switch
3. Crear un tema customizable usando ngClass y ngStyle

## Referencias Oficiales

- [Angular Control Flow Documentation](https://angular.dev/guide/templates/control-flow)
- [Angular @if Directive](https://angular.dev/guide/templates/control-flow#if-block)
- [Angular @for Directive](https://angular.dev/guide/templates/control-flow#for-block)
- [Angular @switch Directive](https://angular.dev/guide/templates/control-flow#switch-block)
- [Angular Built-in Directives](https://angular.dev/guide/directives)
- [Angular Class and Style Binding](https://angular.dev/guide/templates/class-binding)
- [Angular Template Syntax Reference](https://angular.dev/guide/templates)
