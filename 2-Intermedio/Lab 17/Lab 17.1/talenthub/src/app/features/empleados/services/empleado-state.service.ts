import { Injectable, computed, signal } from '@angular/core';
import { Empleado, ROLES_EMPLEADO, RolEmpleado } from '../models/empleado.model';

/**
 * Estado de la feature `empleados` (Lab 17): la lista, si está cargando y el último error, como **Signals**, más el
 * estado derivado (`computed`). Es el único sitio donde se escribe ese estado; no sabe nada de HTTP ni de avisos: de
 * eso se encarga `EmpleadosFacade`, que es lo que usan los componentes.
 *
 * Solo se expone en lectura (`asReadonly`): los cambios pasan por los métodos de abajo.
 */
@Injectable({ providedIn: 'root' })
export class EmpleadoStateService {
  private readonly _empleados = signal<Empleado[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly empleados = this._empleados.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  readonly disponibles = computed(() => this._empleados().filter((e) => e.disponible));
  readonly ocupados = computed(() => this._empleados().filter((e) => !e.disponible));

  /** Cuántos empleados hay de cada rol (todos los roles aparecen, también con 0). */
  readonly totalPorRol = computed(() => {
    const total = Object.fromEntries(ROLES_EMPLEADO.map((rol) => [rol, 0])) as Record<RolEmpleado, number>;
    for (const empleado of this._empleados()) total[empleado.rol] += 1;
    return total;
  });

  setEmpleados(lista: Empleado[]): void {
    this._empleados.set(lista);
  }

  setCargando(valor: boolean): void {
    this._cargando.set(valor);
  }

  setError(mensaje: string | null): void {
    this._error.set(mensaje);
  }

  agregar(empleado: Empleado): void {
    this._empleados.update((lista) => [...lista, empleado]);
  }

  eliminar(id: number): void {
    this._empleados.update((lista) => lista.filter((e) => e.id !== id));
  }

  actualizar(empleado: Empleado): void {
    this._empleados.update((lista) => lista.map((e) => (e.id === empleado.id ? empleado : e)));
  }
}
