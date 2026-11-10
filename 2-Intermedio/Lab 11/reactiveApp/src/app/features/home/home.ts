import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="card hero">
      <h1>Gestor de Usuarios</h1>
      <p>
        Práctica final de Angular básico: lista, consulta, crea, edita y elimina
        usuarios consumiendo una API mockeada con <code>HttpClient</code>.
      </p>
      <div class="actions">
        <a class="btn btn-primary" routerLink="/users">Ver usuarios</a>
        <a class="btn btn-outline" routerLink="/add-user">Añadir usuario</a>
      </div>
    </section>
  `,
  styles: `
    .hero { text-align: center; }
    .actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; }
  `,
})
export class Home {}
