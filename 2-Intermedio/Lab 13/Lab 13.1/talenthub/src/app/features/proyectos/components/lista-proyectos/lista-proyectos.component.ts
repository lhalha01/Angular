import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Listado de proyectos. De momento un marcador: los datos y las tarjetas llegan en laboratorios posteriores. */
@Component({
  selector: 'app-lista-proyectos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="proyectos">
      <h1>Proyectos</h1>
      <p>Aquí se mostrarán los proyectos y el equipo asignado a cada uno.</p>
    </section>
  `,
  styles: `
    .proyectos {
      padding: 1.5rem;
    }
  `,
})
export class ListaProyectos {}
