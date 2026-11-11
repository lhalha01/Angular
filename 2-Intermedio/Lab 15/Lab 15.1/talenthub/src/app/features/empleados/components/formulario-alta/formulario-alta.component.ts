import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ConCambiosPendientes } from '@core/guards/cambios-pendientes.guard';
import { NotificacionService } from '@core/services/notificacion.service';
import { EMPTY, Subject, catchError, exhaustMap, finalize } from 'rxjs';
import { NuevoEmpleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';

/**
 * Formulario de alta de empleado. Lo que hace en este Lab es la **protección de doble envío**: los envíos pasan
 * por un `Subject` con `exhaustMap`, que ignora los que llegan mientras hay uno en curso (aunque se pulse varias
 * veces seguidas solo se crea un empleado). Sus campos y validaciones reales (Reactive Forms) llegan en el Lab 16.
 *
 * Sin suscripciones manuales sueltas: el flujo se cierra con `takeUntilDestroyed()`. Los errores HTTP los avisa el
 * interceptor; aquí solo se evita que un fallo termine el flujo (se captura dentro del `exhaustMap`), para poder reintentar.
 */
@Component({
  selector: 'app-formulario-alta',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alta">
      <h1>Alta de empleado</h1>

      <form (submit)="onSubmit($event)">
        <label>
          Nombre
          <input name="nombre" [value]="nombre()" (input)="nombre.set(valor($event))" />
        </label>
        <label>
          Email
          <input name="email" type="email" [value]="email()" (input)="email.set(valor($event))" />
        </label>

        <div class="acciones">
          <button type="submit" [disabled]="enviando() || !completo()">Dar de alta</button>
          <a routerLink="/empleados">Cancelar</a>
        </div>
      </form>
    </section>
  `,
  styles: `
    .alta { padding: 1.5rem; max-width: 28rem; }
    form { display: grid; gap: 0.75rem; }
    label { display: grid; gap: 0.25rem; }
    .acciones { display: flex; gap: 1rem; align-items: center; }
    button { padding: 0.5rem 1rem; border: 0; border-radius: 0.5rem; background: #2563eb; color: #fff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `,
})
export class FormularioAlta implements ConCambiosPendientes {
  private readonly servicio = inject(EmpleadoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly nombre = signal('');
  protected readonly email = signal('');
  protected readonly enviando = signal(false);

  /** Verdadero una vez dado de alta: ya no hay nada sin guardar (el guard no debe preguntar al salir). */
  private readonly guardado = signal(false);
  private readonly sucio = computed(() => !this.guardado() && (this.nombre().trim() !== '' || this.email().trim() !== ''));

  protected readonly completo = computed(() => this.nombre().trim() !== '' && this.email().trim() !== '');

  /** Cada pulsación de «Dar de alta» entra por aquí; `exhaustMap` descarta las que llegan con un envío en curso. */
  readonly envio$ = new Subject<NuevoEmpleado>();

  constructor() {
    this.envio$
      .pipe(
        exhaustMap((datos) =>
          this.servicio.crear(datos).pipe(
            catchError(() => EMPTY), // el aviso lo da el interceptor; el flujo sigue vivo para reintentar
            finalize(() => this.enviando.set(false)),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((creado) => {
        this.guardado.set(true);
        this.notificaciones.exito(`${creado.nombre} incorporado correctamente`);
        void this.router.navigate(['/empleados']);
      });
  }

  tieneCambiosPendientes(): boolean {
    return this.sucio();
  }

  protected onSubmit(evento: Event): void {
    evento.preventDefault();
    if (!this.completo()) return;
    this.enviando.set(true);
    // Rol, habilidades y disponibilidad por defecto: el formulario completo (Lab 16) los pedirá.
    this.envio$.next({
      nombre: this.nombre().trim(),
      email: this.email().trim(),
      rol: 'desarrollador',
      habilidades: [],
      disponible: true,
      proyectoActualId: null,
    });
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
