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
