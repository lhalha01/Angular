import { Component } from "@angular/core";
import { FormsModule } from '@angular/forms';

@Component({
  selector: "app-event-binding",
  imports: [FormsModule],
  template: `
    <div class="event-binding-examples">
      <h3>Ejemplos de Event Binding</h3>

      <div class="example">
        <h4>Click simple:</h4>
        <button (click)="onButtonClick()">Click aquí</button>
        <p>Clicks: {{ contadorClicks }}</p>
      </div>

      <div class="example">
        <h4>Eventos de teclado:</h4>
        <input
          (keyup)="onKeyUp($event)"
          (keydown)="onKeyDown($event)"
          placeholder="Escribe algo..."
        />
        <p>Última tecla presionada: {{ ultimaTecla }}</p>
        <p>Teclas presionadas: {{ teclasPresionadas }}</p>
      </div>

      <div class="example">
        <h4>Eventos de mouse:</h4>
        <div
          class="mouse-area"
          (mouseenter)="onMouseEnter()"
          (mouseleave)="onMouseLeave()"
          (mousemove)="onMouseMove($event)"
        >
          <p>{{ estadoMouse }}</p>
          <p>Posición: X={{ mouseX }}, Y={{ mouseY }}</p>
        </div>
      </div>

      <div class="example">
        <h4>Evento de cambio en select:</h4>
        <select (change)="onSelectChange($event)">
          <option value="">Selecciona una opción</option>
          <option value="angular">Angular</option>
          <option value="react">React</option>
          <option value="vue">Vue</option>
        </select>
        <p>Seleccionado: {{ opcionSeleccionada }}</p>
      </div>

      <div class="example">
        <h4>Evento de envío de formulario:</h4>
        <form (submit)="onFormSubmit($event)">
          <input
            [(ngModel)]="nombreFormulario"
            placeholder="Tu nombre"
            name="yourName"
            required
          />
          <button type="submit">Enviar</button>
        </form>
        <p>{{ mensajeFormulario }}</p>
      </div>

      <div class="example">
        <h4>Evento personalizado con parámetros:</h4>
        <button (click)="saludar('Buenos días')">Buenos días</button>
        <button (click)="saludar('Buenas tardes')">Buenas tardes</button>
        <button (click)="saludar('Buenas noches')">Buenas noches</button>
        <p>{{ saludo }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .event-binding-examples {
        padding: 1rem;
      }

      .example {
        margin: 1rem 0;
        padding: 1rem;
        background-color: white;
        border-left: 4px solid #dc3545;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h4 {
        color: #dc3545;
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

      button:hover {
        background-color: #005fa3;
      }

      input,
      select {
        margin: 0.5rem;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .mouse-area {
        width: 300px;
        height: 150px;
        border: 2px dashed #007acc;
        padding: 1rem;
        margin: 1rem 0;
        background-color: #f8f9fa;
        cursor: crosshair;
      }

      p {
        margin: 0.5rem 0;
        font-weight: bold;
      }

      form {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    `,
  ],
})
export class EventBinding {
  contadorClicks = 0;
  ultimaTecla = "";
  teclasPresionadas = 0;
  estadoMouse = "Mouse fuera del área";
  mouseX = 0;
  mouseY = 0;
  opcionSeleccionada = "";
  nombreFormulario = "";
  mensajeFormulario = "";
  saludo = "";

  onButtonClick(): void {
    this.contadorClicks++;
  }

  onKeyUp(event: KeyboardEvent): void {
    this.ultimaTecla = event.key;
  }

  onKeyDown(event: KeyboardEvent): void {
    this.teclasPresionadas++;
  }

  onMouseEnter(): void {
    this.estadoMouse = "Mouse dentro del área";
  }

  onMouseLeave(): void {
    this.estadoMouse = "Mouse fuera del área";
    this.mouseX = 0;
    this.mouseY = 0;
  }

  onMouseMove(event: MouseEvent): void {
    this.mouseX = event.offsetX;
    this.mouseY = event.offsetY;
  }

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.opcionSeleccionada = target.value;
  }

  onFormSubmit(event: Event): void {
    event.preventDefault();
    this.mensajeFormulario = `Formulario enviado con nombre: ${this.nombreFormulario}`;
  }

  saludar(tipoSaludo: string): void {
    this.saludo = `${tipoSaludo}, ${this.nombreFormulario || "Usuario"}!`;
  }
}
