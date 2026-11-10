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
