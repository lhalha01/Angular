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
