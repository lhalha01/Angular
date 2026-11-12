import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pantalla de inicio de TalentHub. De momento un marcador: las estadísticas llegan en laboratorios posteriores. */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dashboard">
      <h1>Dashboard</h1>
      <p>Aquí se mostrarán el total de empleados, los disponibles y los proyectos activos.</p>
    </section>
  `,
  styles: `
    .dashboard {
      padding: 1.5rem;
    }
  `,
})
export class Dashboard {}
