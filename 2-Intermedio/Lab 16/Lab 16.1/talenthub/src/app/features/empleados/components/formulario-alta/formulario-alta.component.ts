import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConCambiosPendientes } from '@core/guards/cambios-pendientes.guard';
import { NotificacionService } from '@core/services/notificacion.service';
import { Proyecto, ProyectoService } from '@features/proyectos';
import { emailUnicoValidator } from '@shared/validators/email-unico.validator';
import { proyectoObligatorioSiOcupado } from '@shared/validators/proyecto-obligatorio.validator';
import { soloLetrasYEspacios } from '@shared/validators/solo-letras.validator';
import { EMPTY, Subject, catchError, exhaustMap, finalize, map, of } from 'rxjs';
import { Habilidad, NuevoEmpleado, ROLES_EMPLEADO, RolEmpleado } from '../../models/empleado.model';
import { EmpleadoService } from '../../services/empleado.service';

type NivelHabilidad = Habilidad['nivel'];
type HabilidadForm = FormGroup<{ nombre: FormControl<string>; nivel: FormControl<NivelHabilidad> }>;

const NIVELES: readonly { valor: NivelHabilidad; texto: string }[] = [
  { valor: 'junior', texto: 'Junior' },
  { valor: 'mid', texto: 'Mid' },
  { valor: 'senior', texto: 'Senior' },
];

/**
 * Formulario de alta de empleado con **Reactive Forms** (Lab 16): validadores síncronos y asíncrono, validación
 * cruzada de disponibilidad y proyecto, y una lista dinámica de habilidades (`FormArray`).
 *
 * - Los errores se muestran solo tras tocar el campo o al intentar enviar (`mostrarError`).
 * - El envío mantiene la protección de doble envío del Lab 15 (`Subject` + `exhaustMap`) y el botón se desactiva
 *   mientras se procesa; el error HTTP lo avisa el interceptor.
 * - `tieneCambiosPendientes()` (lo lee el guard al salir) sale de `form.dirty`.
 */
@Component({
  selector: 'app-formulario-alta',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alta">
      <h1>Alta de empleado</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="campo">
          <label for="nombre">Nombre</label>
          <input id="nombre" name="nombre" formControlName="nombre" autocomplete="name" />
          @if (mostrarError(nombre)) {
            <small class="error" role="alert">
              @if (nombre.hasError('required')) { El nombre es obligatorio. } @else { Solo se admiten letras y espacios. }
            </small>
          }
        </div>

        <div class="campo">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" formControlName="email" autocomplete="email" />
          @if (email.pending) {
            <small class="info" role="status">Comprobando el email…</small>
          } @else if (mostrarError(email)) {
            <small class="error" role="alert">
              @if (email.hasError('required')) {
                El email es obligatorio.
              } @else if (email.hasError('email')) {
                El email no tiene un formato válido.
              } @else {
                Ese email ya está en uso.
              }
            </small>
          }
        </div>

        <div class="campo">
          <label for="rol">Rol</label>
          <select id="rol" name="rol" formControlName="rol">
            @for (rol of roles; track rol) {
              <option [value]="rol">{{ rol }}</option>
            }
          </select>
        </div>

        <div class="campo campo--linea">
          <input id="disponible" name="disponible" type="checkbox" formControlName="disponible" />
          <label for="disponible">Disponible para nuevos proyectos</label>
        </div>

        <div class="campo">
          <label for="proyecto">Proyecto actual</label>
          <select id="proyecto" name="proyecto" formControlName="proyectoActualId">
            <option [ngValue]="null">Sin proyecto</option>
            @for (proyecto of proyectos(); track proyecto.id) {
              <option [ngValue]="proyecto.id">{{ proyecto.nombre }}</option>
            }
          </select>
        </div>

        @if (form.hasError('proyectoObligatorio') && (form.touched || enviado())) {
          <p class="error error--grupo" role="alert">Un empleado que no está disponible debe tener un proyecto asignado.</p>
        }

        <fieldset class="habilidades">
          <legend>Habilidades</legend>
          @for (habilidad of habilidades.controls; track habilidad; let i = $index) {
            <div class="habilidad" [formGroup]="habilidad">
              <div class="campo">
                <input [attr.aria-label]="'Nombre de la habilidad ' + (i + 1)" formControlName="nombre" placeholder="Habilidad" />
                @if (mostrarError(habilidad.controls.nombre)) {
                  <small class="error" role="alert">
                    @if (habilidad.controls.nombre.hasError('required')) { Escribe la habilidad. } @else { Máximo 30 caracteres. }
                  </small>
                }
              </div>
              <select [attr.aria-label]="'Nivel de la habilidad ' + (i + 1)" formControlName="nivel">
                @for (nivel of niveles; track nivel.valor) {
                  <option [value]="nivel.valor">{{ nivel.texto }}</option>
                }
              </select>
              <button type="button" class="quitar" [attr.aria-label]="'Quitar la habilidad ' + (i + 1)" (click)="eliminarHabilidad(i)">✕</button>
            </div>
          } @empty {
            <p class="vacio">Sin habilidades todavía.</p>
          }
          <button type="button" class="secundario" (click)="agregarHabilidad()">+ Añadir habilidad</button>
        </fieldset>

        <div class="acciones">
          <button type="submit" [disabled]="enviando()">{{ enviando() ? 'Dando de alta…' : 'Dar de alta' }}</button>
          <a routerLink="/empleados">Cancelar</a>
        </div>
      </form>
    </section>
  `,
  styles: `
    .alta { padding: 1.5rem; max-width: 34rem; }
    form { display: grid; gap: 1rem; }
    .campo { display: grid; gap: 0.25rem; }
    .campo--linea { display: flex; align-items: center; gap: 0.5rem; }
    input:not([type='checkbox']), select { padding: 0.45rem 0.6rem; }
    input.ng-invalid.ng-touched, select.ng-invalid.ng-touched { border-color: #b91c1c; }
    .error { color: #b91c1c; font-size: 0.85rem; }
    .error--grupo { margin: 0; padding: 0.5rem 0.75rem; border: 1px solid #b91c1c; border-radius: 0.5rem; background: #fef2f2; }
    .info { color: #475569; font-size: 0.85rem; }
    .habilidades { display: grid; gap: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.75rem; }
    .habilidad { display: grid; grid-template-columns: 1fr auto auto; gap: 0.5rem; align-items: start; }
    .vacio { margin: 0; color: #64748b; }
    .acciones { display: flex; gap: 1rem; align-items: center; }
    button { padding: 0.5rem 1rem; border: 0; border-radius: 0.5rem; background: #2563eb; color: #fff; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secundario { background: #e2e8f0; color: #0f172a; justify-self: start; }
    button.quitar { background: transparent; color: #b91c1c; padding: 0.45rem 0.6rem; }
  `,
})
export class FormularioAlta implements ConCambiosPendientes {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(EmpleadoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly roles = ROLES_EMPLEADO;
  protected readonly niveles = NIVELES;

  /** Los proyectos que se pueden asignar (si no cargan, la lista queda vacía: «Sin proyecto» sigue disponible). */
  protected readonly proyectos = toSignal(
    inject(ProyectoService)
      .getAll()
      .pipe(
        map((lista): Proyecto[] => lista),
        catchError(() => of<Proyecto[]>([])),
      ),
    { initialValue: [] as Proyecto[] },
  );

  readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, soloLetrasYEspacios]],
      email: this.fb.control('', { validators: [Validators.required, Validators.email], asyncValidators: [emailUnicoValidator()] }),
      rol: this.fb.control<RolEmpleado>('desarrollador', Validators.required),
      disponible: [true],
      proyectoActualId: new FormControl<number | null>(null, { nonNullable: false }),
      habilidades: this.fb.array<HabilidadForm>([]),
    },
    { validators: proyectoObligatorioSiOcupado },
  );

  protected get nombre() {
    return this.form.controls.nombre;
  }
  protected get email() {
    return this.form.controls.email;
  }
  protected get habilidades(): FormArray<HabilidadForm> {
    return this.form.controls.habilidades;
  }

  protected readonly enviando = signal(false);
  /** Verdadero tras el primer intento de envío: a partir de ahí se muestran todos los errores. */
  protected readonly enviado = signal(false);
  /** Verdadero una vez dado de alta: ya no hay nada sin guardar (el guard no debe preguntar al salir). */
  private readonly guardado = signal(false);

  /** Cada pulsación válida de «Dar de alta» entra por aquí; `exhaustMap` descarta las que llegan con un envío en curso. */
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
    return this.form.dirty && !this.guardado();
  }

  /** Un error se enseña solo si el usuario ya tocó el campo o intentó enviar el formulario. */
  protected mostrarError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.enviado());
  }

  protected agregarHabilidad(): void {
    this.habilidades.push(
      this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(30)]],
        nivel: this.fb.control<NivelHabilidad>('mid', Validators.required),
      }),
    );
    this.form.markAsDirty();
  }

  protected eliminarHabilidad(indice: number): void {
    this.habilidades.removeAt(indice);
    this.form.markAsDirty();
  }

  protected onSubmit(): void {
    this.enviado.set(true);
    // Con el email aún en comprobación (PENDING) o con errores no se envía: se enseñan todos los errores.
    if (this.form.status !== 'VALID') {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.envio$.next({
      nombre: v.nombre.trim().replace(/\s+/g, ' '),
      email: v.email.trim(),
      rol: v.rol,
      habilidades: v.habilidades.map((h): Habilidad => ({ nombre: h.nombre.trim(), nivel: h.nivel })),
      disponible: v.disponible,
      proyectoActualId: v.proyectoActualId,
    });
  }
}
