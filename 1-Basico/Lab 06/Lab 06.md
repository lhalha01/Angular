
[[_TOC_]]

# Lab 06: DataBindings Modernos

Este laboratorio te enseñará a implementar los diferentes tipos de data binding en Angular usando sintaxis moderna y mejores prácticas.

### 1. Crear componentes standalone

Navegamos a la carpeta src/app y creamos una estructura organizada:

```bash
# Crear componentes
ng generate component components/interpolacion --skip-tests
ng generate component components/property-binding --skip-tests
ng generate component components/event-binding --skip-tests
ng generate component components/two-way-binding --skip-tests
```

### 2. Añadir los componentes a un componente nuevo de ruta

```bash
ng generate component features/data.bindings --skip-tests
```

**data.bindings.ts**:

```typescript
import { Component } from '@angular/core';
import { Interpolacion } from '../../components/interpolacion/interpolacion';
import { PropertyBinding } from '../../components/property-binding/property-binding';
import { EventBinding } from '../../components/event-binding/event-binding';
import { TwoWayBinding } from '../../components/two-way-binding/two-way-binding';

@Component({
  selector: 'app-data-bindings',
  imports: [Interpolacion, PropertyBinding, EventBinding, TwoWayBinding],
  template: `
    <div class="container">
      <h1>{{ title }}</h1>
      <section class="binding-section">
        <h2>1. Interpolación</h2>
        <app-interpolacion></app-interpolacion>
      </section>
      <hr />
      <section class="binding-section">
        <h2>2. Property Binding</h2>
        <app-property-binding></app-property-binding>
      </section>
      <hr /> 
      <section class="binding-section">
        <h2>3. Event Binding</h2>
        <app-event-binding></app-event-binding>
      </section>
      <hr />
      <section class="binding-section">
        <h2>4. Two-way Binding</h2>
        <app-two-way-binding></app-two-way-binding>
      </section>
    </div>
  `,

  styles: [
    `
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: Arial, sans-serif;
      }

      .binding-section {
        margin: 2rem 0;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }

      hr {
        margin: 2rem 0;
        border: none;
        border-top: 2px solid #eee;
      }

      h1 {
        color: #333;
        text-align: center;
      }

      h2 {
        color: #666;
        border-bottom: 2px solid #007acc;
        padding-bottom: 0.5rem;
      }
    `,
  ],
})
export class DataBindings {
  title = 'DataBindings en Angular';
}
```

## Ejemplos de Interpolación

**interpolacion.ts**:

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-interpolacion",
  template: `
    <div class="interpolacion-examples">
      <h3>Ejemplos de Interpolación</h3>

      <div class="example">
        <h4>Cadena simple:</h4>
        <p>{{ cadenaTexto }}</p>
      </div>

      <div class="example">
        <h4>Concatenación:</h4>
        <p>{{ "Hola " + nombre + ", bienvenido!" }}</p>
      </div>

      <div class="example">
        <h4>Operaciones matemáticas:</h4>
        <p>{{ numero1 }} + {{ numero2 }} = {{ numero1 + numero2 }}</p>
        <p>{{ numero1 }} * {{ numero2 }} = {{ numero1 * numero2 }}</p>
      </div>

      <div class="example">
        <h4>Método del componente:</h4>
        <p>{{ obtenerSaludo() }}</p>
      </div>

      <div class="example">
        <h4>Expresiones condicionales:</h4>
        <p>Estado: {{ estaActivo ? "Activo" : "Inactivo" }}</p>
        <p>Precio: {{ precio > 100 ? "Caro" : "Económico" }}</p>
      </div>

      <div class="example">
        <h4>Propiedades de objetos:</h4>
        <p>Usuario: {{ usuario.nombre }} {{ usuario.apellido }}</p>
        <p>Email: {{ usuario.email }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .interpolacion-examples {
        padding: 1rem;
      }

      .example {
        margin: 1rem 0;
        padding: 1rem;
        background-color: white;
        border-left: 4px solid #007acc;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h4 {
        color: #007acc;
        margin-top: 0;
      }

      p {
        margin: 0.5rem 0;
        font-weight: bold;
      }
    `,
  ],
})
export class Interpolacion {
  cadenaTexto = "Esta es una cadena de texto";
  nombre = "Angular Developer";
  numero1 = 25;
  numero2 = 5;
  estaActivo = true;
  precio = 150;

  usuario = {
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.perez@email.com",
  };

  obtenerSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  }
}
```

## Ejemplos de Property Binding

**property-binding.ts**:

```typescript
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
```

## Ejemplos de Event Binding

**event-binding.ts**:

```typescript
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
```

## Ejemplos de Two-way Binding

**two-way-binding.ts**:

```typescript
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
```

### 3. Configurar la nueva navegación

Añadir en app.routes.ts la nueva navegación:

```javascript
  {
    path: 'databindings',
    loadComponent: () =>
      import('./features/data.bindings/data.bindings').then((m) => m.DataBindings),
    title: 'Databindings',
  },
```

Añadir en header.ts, dentro del template, la navegación a data binding:

```html
    <nav class="navigation">
      <ul>
        <li><a (click)="navigate('home')">Inicio</a></li>
        <li><a (click)="navigate('counter')">Counter</a></li>
        <li><a (click)="navigate('users')">Users</a></li>
        <li><a (click)="navigate('directives')">Directivas</a></li>
        <li><a (click)="navigate('databindings')">Data Bindings</a></li>
      </ul>
    </nav>
```

### 4. Iniciar la aplicación

```bash
ng serve
```

Navega a `http://localhost:4200/` para ver todos los ejemplos de data binding en acción.

## Puntos Clave del Laboratorio

1. **Interpolación**: Muestra datos del componente en el template
2. **Property Binding**: Asigna valores a propiedades de elementos HTML
3. **Event Binding**: Maneja eventos del usuario
4. **Two-way Binding**: Sincronización bidireccional entre template y componente

## Ejercicios Adicionales

1. Crear un calculadora simple usando event binding
2. Implementar un formulario de registro completo con validación
3. Crear un componente de lista de tareas (ToDo) que combine todos los tipos de binding
