import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificacionService } from '@core/services/notificacion.service';
import { Observable, Subject, catchError, lastValueFrom, of, switchMap } from 'rxjs';
import { Empleado, NuevoEmpleado } from '../models/empleado.model';
import { EmpleadoStateService } from './empleado-state.service';
import { EmpleadoService } from './empleado.service';

/**
 * Fachada de la feature `empleados` (Lab 17): lo único que ven los componentes. Junta el estado
 * (`EmpleadoStateService`), el acceso a datos (`EmpleadoService`) y los avisos (`NotificacionService`), de modo que un
 * componente no sabe de HTTP ni de dónde sale cada dato.
 *
 * - El estado se expone en solo lectura (señales y `computed`).
 * - `cargar()` se puede llamar con cada búsqueda: si llega una nueva con otra en vuelo, se cancela la anterior (`switchMap`).
 *   Si ya se pidió ese mismo término (y no hubo error) no se vuelve a pedir: así, al volver al directorio después de dar de
 *   alta a alguien, se ve el estado actual sin otra petición. `recargar()` fuerza una carga nueva.
 * - Dar de alta y eliminar actualizan la lista **sin volver a pedirla** a la API.
 * - Los errores HTTP los avisa el interceptor; aquí solo se decide qué pasa con el estado.
 */
@Injectable({ providedIn: 'root' })
export class EmpleadosFacade {
  private readonly state = inject(EmpleadoStateService);
  private readonly service = inject(EmpleadoService);
  private readonly notif = inject(NotificacionService);

  // Estado (solo lectura para los componentes)
  readonly empleados = this.state.empleados;
  readonly cargando = this.state.cargando;
  readonly error = this.state.error;
  readonly disponibles = this.state.disponibles;
  readonly ocupados = this.state.ocupados;
  readonly totalPorRol = this.state.totalPorRol;

  private readonly carga$ = new Subject<string>();
  /** El último término que se pidió (`null` si aún no se ha pedido nada). */
  private ultimoTermino: string | null = null;

  constructor() {
    // Cada petición de carga cancela la que hubiera en vuelo; `cargando` solo se apaga cuando llega la última.
    this.carga$
      .pipe(
        switchMap((termino) => {
          this.state.setCargando(true);
          this.state.setError(null);
          return this.service.getAll(termino).pipe(
            catchError(() => {
              this.state.setError('No se pudieron cargar los empleados.');
              return of<Empleado[] | null>(null);
            }),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((lista) => {
        if (lista !== null) this.state.setEmpleados(lista);
        this.state.setCargando(false);
      });
  }

  /**
   * Carga los empleados, o solo los que coinciden con `termino` (búsqueda en la API), y sustituye la lista actual. No hace
   * nada si ese mismo término ya está cargado (o en camino) sin error; con `forzar` se pide de todos modos.
   */
  cargar(termino = '', opciones: { forzar?: boolean } = {}): void {
    if (!opciones.forzar && termino === this.ultimoTermino && this.state.error() === null) return;
    this.ultimoTermino = termino;
    this.carga$.next(termino);
  }

  /** Vuelve a pedir la lista con el último término (para refrescar a mano o reintentar tras un error). */
  recargar(): void {
    this.cargar(this.ultimoTermino ?? '', { forzar: true });
  }

  /** Un empleado concreto desde la API (lo usa el resolver del perfil), o `null` si no existe. */
  obtenerPorId(id: number): Observable<Empleado | null> {
    return this.service.getById(id);
  }

  /**
   * Da de alta un empleado y lo añade a la lista sin recargarla. Si falla, la promesa se rechaza (el aviso del error
   * ya lo ha dado el interceptor) y la lista no cambia.
   */
  async darDeAlta(datos: NuevoEmpleado): Promise<Empleado> {
    const nuevo = await lastValueFrom(this.service.crear(datos));
    this.state.agregar(nuevo);
    this.notif.exito(`${nuevo.nombre} incorporado correctamente`);
    return nuevo;
  }

  /**
   * Elimina un empleado y lo quita de la lista sin recargarla. Devuelve si se eliminó; si falla devuelve `false` (el
   * interceptor ya ha avisado) y la lista no cambia. Con el backend local, borrar un usuario borra también sus tareas.
   */
  async eliminar(id: number): Promise<boolean> {
    try {
      await lastValueFrom(this.service.eliminar(id));
    } catch {
      return false;
    }
    this.state.eliminar(id);
    return true;
  }
}
