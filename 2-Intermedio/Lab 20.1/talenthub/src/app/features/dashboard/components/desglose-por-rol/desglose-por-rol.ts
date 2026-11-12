import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RolEmpleado } from '@features/empleados';

/** Desglose de empleados por rol, con una barra proporcional al rol que más tiene. Es el bloque que el dashboard difiere. */
@Component({
  selector: 'app-desglose-por-rol',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="desglose" aria-labelledby="desglose-titulo">
      <h2 id="desglose-titulo">Empleados por rol</h2>
      <ul>
        @for (fila of filas(); track fila.rol) {
          <li>
            <span class="rol">{{ fila.rol }}</span>
            <span class="barra" aria-hidden="true"><span class="relleno" [style.width.%]="fila.porcentaje"></span></span>
            <span class="total">{{ fila.total }}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .desglose { padding: 1rem 1.25rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; background: #fff; }
    h2 { margin: 0 0 0.75rem; font-size: 1.1rem; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
    li { display: grid; grid-template-columns: 8rem 1fr 2rem; align-items: center; gap: 0.75rem; }
    .rol { text-transform: capitalize; }
    .barra { height: 0.6rem; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
    .relleno { display: block; height: 100%; background: #2563eb; }
    .total { text-align: right; font-variant-numeric: tabular-nums; }
  `,
})
export class DesglosePorRol {
  readonly totalesPorRol = input.required<Record<RolEmpleado, number>>();

  protected readonly filas = computed(() => {
    const entradas = Object.entries(this.totalesPorRol()) as [RolEmpleado, number][];
    const maximo = Math.max(1, ...entradas.map(([, total]) => total));
    return entradas.map(([rol, total]) => ({ rol, total, porcentaje: (total / maximo) * 100 }));
  });
}
