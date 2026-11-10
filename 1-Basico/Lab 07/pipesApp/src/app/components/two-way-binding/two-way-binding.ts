import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

interface Usuario {
  nombre: string;
  email: string;
  edad: number;
  activo: boolean;
  pais: string;
  descripcion: string;
}

@Component({
  selector: "app-two-way-binding",
  imports: [FormsModule, CommonModule],
  template: `
    <div class="two-way-binding-examples">
      <h3>Ejemplos de Two-way Binding</h3>

      <div class="example">
        <h4>Input text básico:</h4>
        <input [(ngModel)]="textoSimple" placeholder="Escribe algo..." />
        <p>Valor actual: "{{ textoSimple }}"</p>
      </div>

      <div class="example">
        <h4>Formulario de usuario completo:</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Nombre:</label>
            <input [(ngModel)]="usuario.nombre" placeholder="Tu nombre" />
          </div>

          <div class="form-group">
            <label>Email:</label>
            <input
              [(ngModel)]="usuario.email"
              type="email"
              placeholder="tu@email.com"
            />
          </div>

          <div class="form-group">
            <label>Edad:</label>
            <input [(ngModel)]="usuario.edad" type="number" min="0" max="120" />
          </div>

          <div class="form-group">
            <label>País:</label>
            <select [(ngModel)]="usuario.pais">
              <option value="">Selecciona un país</option>
              <option value="es">España</option>
              <option value="mx">México</option>
              <option value="ar">Argentina</option>
              <option value="co">Colombia</option>
            </select>
          </div>

          <div class="form-group">
            <label>
              <input [(ngModel)]="usuario.activo" type="checkbox" />
              Usuario activo
            </label>
          </div>

          <div class="form-group full-width">
            <label>Descripción:</label>
            <textarea
              [(ngModel)]="usuario.descripcion"
              placeholder="Cuéntanos sobre ti..."
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="example">
        <h4>Vista previa en tiempo real:</h4>
        <div class="preview-card">
          <h5>Perfil de Usuario</h5>
          <p><strong>Nombre:</strong> {{ usuario.nombre || "Sin nombre" }}</p>
          <p><strong>Email:</strong> {{ usuario.email || "Sin email" }}</p>
          <p><strong>Edad:</strong> {{ usuario.edad || "No especificada" }}</p>
          <p><strong>País:</strong> {{ obtenerNombrePais(usuario.pais) }}</p>
          <p>
            <strong>Estado:</strong>
            <span
              [class]="usuario.activo ? 'estado-activo' : 'estado-inactivo'"
            >
              {{ usuario.activo ? "Activo" : "Inactivo" }}
            </span>
          </p>
          <p>
            <strong>Descripción:</strong>
            {{ usuario.descripcion || "Sin descripción" }}
          </p>
        </div>
      </div>

      <div class="example">
        <h4>Lista dinámica:</h4>
        <input
          [(ngModel)]="nuevoItem"
          (keyup.enter)="agregarItem()"
          placeholder="Escribe un elemento y presiona Enter"
        />
        <button (click)="agregarItem()" [disabled]="!nuevoItem.trim()">
          Agregar
        </button>

        @if (lista.length > 0) {
        <ul>
          @for (item of lista; track $index; let i = $index) {
          <li>
            {{ item }}
            <button (click)="eliminarItem(i)" class="btn-eliminar">×</button>
          </li>
          }
        </ul>
        <button (click)="limpiarLista()" class="btn-limpiar">
          Limpiar lista
        </button>
        }
      </div>

      <div class="example">
        <h4>Datos en formato JSON:</h4>
        <pre>{{ usuario | json }}</pre>
      </div>
    </div>
  `,
  styles: [
    `
      .two-way-binding-examples {
        padding: 1rem;
      }

      .example {
        margin: 1rem 0;
        padding: 1rem;
        background-color: white;
        border-left: 4px solid #6610f2;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h4 {
        color: #6610f2;
        margin-top: 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #333;
      }

      input,
      select,
      textarea {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: none;
        border-color: #6610f2;
        box-shadow: 0 0 0 2px rgba(102, 16, 242, 0.2);
      }

      .preview-card {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #dee2e6;
      }

      .preview-card h5 {
        margin-top: 0;
        color: #6610f2;
      }

      .estado-activo {
        color: green;
        font-weight: bold;
      }

      .estado-inactivo {
        color: red;
        font-weight: bold;
      }

      button {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background-color: #6610f2;
        color: white;
        cursor: pointer;
      }

      button:hover:not(:disabled) {
        background-color: #520dc2;
      }

      button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      ul {
        list-style: none;
        padding: 0;
      }

      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        margin: 0.5rem 0;
        background-color: #f8f9fa;
        border-radius: 4px;
      }

      .btn-eliminar {
        background-color: #dc3545;
        margin: 0;
        padding: 0.25rem 0.5rem;
        font-size: 1.2rem;
        line-height: 1;
      }

      .btn-eliminar:hover {
        background-color: #c82333;
      }

      .btn-limpiar {
        background-color: #dc3545;
      }

      .btn-limpiar:hover {
        background-color: #c82333;
      }

      pre {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class TwoWayBinding {
  textoSimple = "";

  usuario: Usuario = {
    nombre: "",
    email: "",
    edad: 0,
    activo: true,
    pais: "",
    descripcion: "",
  };

  nuevoItem = "";
  lista: string[] = [];

  private paises = {
    es: "España",
    mx: "México",
    ar: "Argentina",
    co: "Colombia",
  };

  obtenerNombrePais(codigo: string): string {
    return this.paises[codigo as keyof typeof this.paises] || "No seleccionado";
  }

  agregarItem(): void {
    if (this.nuevoItem.trim()) {
      this.lista.push(this.nuevoItem.trim());
      this.nuevoItem = "";
    }
  }

  eliminarItem(indice: number): void {
    this.lista.splice(indice, 1);
  }

  limpiarLista(): void {
    this.lista = [];
  }
}
