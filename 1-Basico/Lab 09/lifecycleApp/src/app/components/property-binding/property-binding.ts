import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-property-binding",
  imports: [CommonModule],
  template: `
    <div class="property-binding-examples">
      <h3>Ejemplos de Property Binding</h3>

      <div class="example">
        <h4>Botón habilitado/deshabilitado:</h4>
        <button [disabled]="botonDeshabilitado">
          {{ botonDeshabilitado ? "Deshabilitado" : "Habilitado" }}
        </button>
        <button (click)="alternarBoton()">Alternar estado</button>
      </div>

      <div class="example">
        <h4>Imagen dinámica:</h4>
        <img [src]="urlImagen" [alt]="textoAlternativo" [width]="anchoImagen" />
        <br />
        <button (click)="cambiarImagen()">Cambiar imagen</button>
      </div>

      <div class="example">
        <h4>Clases CSS dinámicas:</h4>
        <div [class]="claseCSS">Elemento con clase dinámica</div>
        <button (click)="cambiarClase()">Cambiar clase</button>
      </div>

      <div class="example">
        <h4>Estilos dinámicos:</h4>
        <div
          [style.color]="colorTexto"
          [style.font-size.px]="tamanoFuente"
          [style.background-color]="colorFondo"
        >
          Texto con estilos dinámicos
        </div>
        <button (click)="cambiarEstilos()">Cambiar estilos</button>
      </div>

      <div class="example">
        <h4>Atributos HTML:</h4>
        <input
          [value]="valorInput"
          [placeholder]="placeholderTexto"
          [readonly]="soloLectura"
        />
        <button (click)="alternarSoloLectura()">Alternar solo lectura</button>
      </div>
    </div>
  `,
  styles: [
    `
      .property-binding-examples {
        padding: 1rem;
      }

      .example {
        margin: 1rem 0;
        padding: 1rem;
        background-color: white;
        border-left: 4px solid #28a745;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h4 {
        color: #28a745;
        margin-top: 0;
      }

      button {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background-color: #007acc;
        color: white;
        cursor: pointer;
      }

      button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      button:hover:not(:disabled) {
        background-color: #005fa3;
      }

      img {
        border: 2px solid #ddd;
        margin: 0.5rem 0;
      }

      input {
        margin: 0.5rem;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .clase-azul {
        color: blue;
        font-weight: bold;
      }

      .clase-roja {
        color: red;
        font-style: italic;
      }

      .clase-verde {
        color: green;
        text-decoration: underline;
      }
    `,
  ],
})
export class PropertyBinding {
  botonDeshabilitado = false;
  urlImagen = "https://angular.io/assets/images/logos/angular/angular.png";
  textoAlternativo = "Logo de Angular";
  anchoImagen = 100;
  claseCSS = "clase-azul";
  colorTexto = "blue";
  tamanoFuente = 16;
  colorFondo = "#f0f8ff";
  valorInput = "Texto inicial";
  placeholderTexto = "Escribe aquí...";
  soloLectura = false;

  private imagenes = [
    "https://angular.io/assets/images/logos/angular/angular.png",
    "https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg",
  ];
  private indiceImagen = 0;

  private clases = ["clase-azul", "clase-roja", "clase-verde"];
  private indiceClase = 0;

  private colores = ["blue", "red", "green", "purple"];
  private fondos = ["#f0f8ff", "#ffe4e1", "#f0fff0", "#e6e6fa"];
  private tamanos = [16, 20, 24, 18];
  private indiceEstilo = 0;

  alternarBoton(): void {
    this.botonDeshabilitado = !this.botonDeshabilitado;
  }

  cambiarImagen(): void {
    this.indiceImagen = (this.indiceImagen + 1) % this.imagenes.length;
    this.urlImagen = this.imagenes[this.indiceImagen];
    this.textoAlternativo =
      this.indiceImagen === 0 ? "Logo de Angular" : "Logo de TypeScript";
    this.anchoImagen = this.anchoImagen === 100 ? 150 : 100;
  }

  cambiarClase(): void {
    this.indiceClase = (this.indiceClase + 1) % this.clases.length;
    this.claseCSS = this.clases[this.indiceClase];
  }

  cambiarEstilos(): void {
    this.indiceEstilo = (this.indiceEstilo + 1) % this.colores.length;
    this.colorTexto = this.colores[this.indiceEstilo];
    this.colorFondo = this.fondos[this.indiceEstilo];
    this.tamanoFuente = this.tamanos[this.indiceEstilo];
  }

  alternarSoloLectura(): void {
    this.soloLectura = !this.soloLectura;
    this.placeholderTexto = this.soloLectura ? "Solo lectura" : "Editable";
  }
}
