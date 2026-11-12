import { Component, computed, inject, OnDestroy } from '@angular/core';
import { EmpleadosFacade } from '@features/empleados/services/empleados.facade';
import { ProyectoService } from '@features/proyectos/services/proyecto.service';
import { catchError, map, of, Subscription } from 'rxjs';
import { DesglosePorRol } from '../desglose-por-rol/desglose-por-rol';
import { StatCard } from '../stat-card/stat-card';

/**
 * Pantalla de inicio de TalentHub: tres cifras (empleados, disponibles y proyectos activos) y, debajo, el desglose por
 * rol, que no es crítico para el primer pintado y se carga con `@defer`.
 *
 * - Las cifras de empleados salen del estado de `EmpleadosFacade` (la misma lista que el directorio: si ya estaba
 *   cargada no se pide otra vez). Los proyectos activos, de `ProyectoService`; el aviso de un error de carga lo da el
 *   interceptor, aquí la cifra queda como «—».
 * - `@defer (on viewport; prefetch on idle)`: el código del desglose se descarga cuando el navegador está ocioso y se
 *   muestra cuando su hueco entra en pantalla.
 */
@Component({
  selector: 'app-dashboard',
  imports: [StatCard, DesglosePorRol],
  template: `
    <section class="dashboard">
      <h1>Dashboard</h1>

      <div class="stats-resumen">
        <app-stat-card titulo="Empleados" [valor]="totalEmpleados()" />
        <app-stat-card titulo="Disponibles" [valor]="disponibles()" />
        <app-stat-card titulo="Proyectos activos" [valor]="proyectosActivos" />
      </div>

      <app-desglose-por-rol [totalesPorRol]="totalPorRol()" />
    </section>
  `,
  styles: `
    .dashboard { padding: 1.5rem; display: grid; gap: 1.5rem; }
    h1 { margin: 0; }
    .stats-resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; }
    .skeleton-chart, .placeholder-chart { min-height: 12rem; border-radius: 0.75rem; background: #e2e8f0; padding: 1rem; }
  `,
})
export class Dashboard implements OnDestroy {
  private readonly empleados = inject(EmpleadosFacade);
  private readonly proyectos = inject(ProyectoService);

  protected readonly totalPorRol = this.empleados.totalPorRol;
  protected readonly totalEmpleados = computed(() => (this.cargado() ? this.empleados.empleados().length : null));
  protected readonly disponibles = computed(() => (this.cargado() ? this.empleados.disponibles().length : null));

  /** Proyectos en estado «activo», o `null` mientras cargan o si la carga falla. */
  protected proyectosActivos: number | null = null;

  private readonly suscripcion = new Subscription();

  constructor() {
    this.empleados.cargar();
    this.suscripcion.add(
      this.proyectos
        .getAll()
        .pipe(
          map((lista: any) => lista.filter((p: any) => p.estado === 'activo').length),
          catchError(() => of(null)),
        )
        .subscribe((total) => (this.proyectosActivos = total)),
    );
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
  }

  /** Hay una lista que mostrar: ya llegó, o es una recarga y se conserva la anterior; si la carga falla, no hay cifra. */
  private cargado(): boolean {
    return this.empleados.error() === null && (!this.empleados.cargando() || this.empleados.empleados().length > 0);
  }
}
