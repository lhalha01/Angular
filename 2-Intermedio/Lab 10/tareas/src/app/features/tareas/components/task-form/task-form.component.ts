import { ChangeDetectionStrategy, Component, inject, Input, input, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '@features/usuarios';
import { dateRange } from '@shared/validators/date-range.validator';
import { DEFAULT_PRIORITY, MAX_DESCRIPTION_LENGTH, MAX_TAG_LENGTH, MAX_TAGS, PRIORITIES, Priority, TaskDraft } from '../../models/task.model';

/** Lo que el formulario sabe comparar para decidir si hay cambios sin guardar. */
interface Snapshot {
  title: string;
  userId: number;
  description: string;
  priority: Priority;
  completed: boolean;
  startDate: string;
  endDate: string;
  tags: string[];
}

/**
 * Formulario reutilizado por «crear» y «editar», con **Reactive Forms** (Lab 16.2): título, usuario responsable,
 * descripción, prioridad, estado, fechas de inicio y fin (con validación cruzada) y una lista dinámica de etiquetas
 * (`FormArray`).
 *
 * - Los errores se muestran solo tras tocar el campo o al intentar enviar. El botón no se desactiva por estar
 *   inválido (así se pueden ver los errores al pulsarlo); solo mientras el padre guarda (`saving`).
 * - El error de fechas es del grupo (`endBeforeStart`), no de un campo.
 * - Sigue siendo un componente «tonto»: no guarda nada; emite `saved` con los valores y el padre decide.
 */
@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="title">Título</label>
        <input id="title" name="title" formControlName="title" />
        @if (showError(title)) {
          <small class="error">
            @if (title.hasError('required') || title.hasError('pattern')) {
              El título es obligatorio.
            } @else {
              Debe tener entre 3 y 120 caracteres.
            }
          </small>
        }
      </div>

      <div class="field">
        <label for="userId">Usuario responsable</label>
        <select id="userId" name="userId" formControlName="userId">
          @for (u of users.users(); track u.id) {
            <option [ngValue]="u.id">{{ u.id }} · {{ u.name }}</option>
          }
        </select>
        @if (users.users().length === 0) {
          <small class="error">No se pudo cargar la lista de usuarios.</small>
        } @else if (showError(userId)) {
          <small class="error">Selecciona un usuario.</small>
        }
      </div>

      <div class="field">
        <label for="description">Descripción (opcional)</label>
        <textarea id="description" name="description" rows="3" formControlName="description"></textarea>
        @if (showError(description)) {
          <small class="error">La descripción admite como máximo {{ maxDescription }} caracteres.</small>
        }
      </div>

      <div class="field">
        <label for="priority">Prioridad</label>
        <select id="priority" name="priority" formControlName="priority">
          @for (p of priorities; track p.value) {
            <option [ngValue]="p.value">{{ p.label }}</option>
          }
        </select>
      </div>

      <div class="dates">
        <div class="field">
          <label for="startDate">Fecha de inicio</label>
          <input id="startDate" name="startDate" type="date" formControlName="startDate" />
        </div>
        <div class="field">
          <label for="endDate">Fecha de fin</label>
          <input id="endDate" name="endDate" type="date" formControlName="endDate" />
        </div>
      </div>
      @if (form.hasError('endBeforeStart') && (form.touched || submitted())) {
        <small class="error error--group" role="alert">La fecha de fin no puede ser anterior a la de inicio.</small>
      }

      <fieldset class="tags">
        <legend>Etiquetas</legend>
        @for (tag of tags.controls; track tag; let i = $index) {
          <div class="tag-row">
            <div class="field">
              <input [attr.aria-label]="'Etiqueta ' + (i + 1)" [formControl]="tag" placeholder="Etiqueta" />
              @if (showError(tag)) {
                <small class="error">
                  @if (tag.hasError('required') || tag.hasError('pattern')) { Escribe la etiqueta o quítala. } @else { Máximo {{ maxTag }} caracteres. }
                </small>
              }
            </div>
            <button type="button" class="btn btn-secondary" [attr.aria-label]="'Quitar la etiqueta ' + (i + 1)" (click)="removeTag(i)">✕</button>
          </div>
        } @empty {
          <p class="empty">Sin etiquetas.</p>
        }
        <button type="button" class="btn btn-secondary" [disabled]="tags.length >= maxTags" (click)="addTag()">+ Añadir etiqueta</button>
      </fieldset>

      <div class="field field--inline">
        <label for="completed">Completado</label>
        <input id="completed" name="completed" type="checkbox" formControlName="completed" />
      </div>

      <div class="actions">
        <button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Guardando…' : submitLabel() }}</button>
        <button class="btn btn-secondary" type="button" (click)="cancelled.emit()">Cancelar</button>
      </div>
    </form>
  `,
  styles: `
    .dates { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .error--group { display: block; margin-bottom: 1rem; }
    .tags { border: 1px solid var(--border-soft); border-radius: 0.75rem; padding: 0.75rem; margin: 0 0 1rem; }
    .tags legend { color: var(--text-muted); padding: 0 0.4rem; }
    .tag-row { display: flex; gap: 0.5rem; align-items: start; margin-bottom: 0.5rem; }
    .tag-row .field { flex: 1; margin-bottom: 0; }
    .empty { color: var(--text-dim); margin: 0 0 0.5rem; }
    textarea { background: var(--input-bg); color: var(--input-text); border: 1px solid var(--input-border); border-radius: 0.75rem; padding: 0.8rem 0.9rem; resize: vertical; font: inherit; }
  `,
})
export class TaskFormComponent implements OnChanges {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly users = inject(UserService);

  /** Valores iniciales. Se copian (ver `ngOnChanges`): editar el formulario no toca el estado hasta guardar. */
  @Input() value?: TaskDraft;
  readonly submitLabel = input('Guardar');
  /** El padre está guardando: el botón se desactiva para que no se pulse otra vez. */
  readonly saving = input(false);
  readonly saved = output<TaskDraft>();
  readonly cancelled = output<void>();

  protected readonly priorities = PRIORITIES;
  protected readonly maxDescription = MAX_DESCRIPTION_LENGTH;
  protected readonly maxTag = MAX_TAG_LENGTH;
  protected readonly maxTags = MAX_TAGS;

  protected readonly form = this.fb.group(
    {
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120), Validators.pattern(/\S/)]],
      userId: [1, Validators.required],
      description: ['', Validators.maxLength(MAX_DESCRIPTION_LENGTH)],
      priority: this.fb.control<Priority>(DEFAULT_PRIORITY),
      completed: [false],
      startDate: [''],
      endDate: [''],
      tags: this.fb.array<FormControl<string>>([]),
    },
    { validators: dateRange('startDate', 'endDate') },
  );

  protected get title() {
    return this.form.controls.title;
  }
  protected get userId() {
    return this.form.controls.userId;
  }
  protected get description() {
    return this.form.controls.description;
  }
  protected get tags(): FormArray<FormControl<string>> {
    return this.form.controls.tags;
  }

  /** Verdadero tras el primer intento de envío: a partir de ahí se muestran todos los errores. */
  protected readonly submitted = signal(false);

  /** Copia de los valores de partida, para saber si el usuario ha cambiado algo. */
  private initial: Snapshot = this.snapshot();
  private wasSubmitted = false;

  /** Cada vez que el padre pasa un valor inicial nuevo, el formulario empieza de cero con una copia. */
  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['value'];
    if (change?.currentValue) {
      const v = change.currentValue as TaskDraft;
      this.tags.clear();
      for (const tag of v.tags ?? []) this.tags.push(this.newTag(tag));
      this.form.patchValue({
        title: v.title,
        userId: v.userId,
        description: v.description ?? '',
        priority: v.priority,
        completed: v.completed,
        startDate: v.startDate ?? '',
        endDate: v.endDate ?? '',
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.submitted.set(false);
      this.initial = this.snapshot();
      this.wasSubmitted = false;
    }
  }

  /**
   * ¿Hay cambios sin guardar? Compara con los valores de partida (si el usuario escribe y
   * borra, no cuenta) y es `false` tras guardar, para que salir después no pregunte.
   */
  hasUnsavedChanges(): boolean {
    if (this.wasSubmitted) return false;
    return JSON.stringify(this.snapshot()) !== JSON.stringify(this.initial);
  }

  /** Cerrar o recargar la pestaña no pasa por el router: lo cubre el aviso nativo del navegador. */
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  /** Un error se enseña solo si el usuario ya tocó el campo o intentó enviar el formulario. */
  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted());
  }

  protected addTag(): void {
    if (this.tags.length >= MAX_TAGS) return;
    this.tags.push(this.newTag(''));
    this.form.markAsDirty();
  }

  protected removeTag(index: number): void {
    this.tags.removeAt(index);
    this.form.markAsDirty();
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.wasSubmitted = true;
    this.saved.emit(this.toDraft());
  }

  private newTag(value: string): FormControl<string> {
    return this.fb.control(value, [Validators.required, Validators.pattern(/\S/), Validators.maxLength(MAX_TAG_LENGTH)]);
  }

  private snapshot(): Snapshot {
    const v = this.form.getRawValue();
    return {
      title: v.title,
      userId: v.userId,
      description: v.description.trim(),
      priority: v.priority,
      completed: v.completed,
      startDate: v.startDate,
      endDate: v.endDate,
      tags: v.tags.map((t) => t.trim()),
    };
  }

  /**
   * Lo que se emite. Los campos opcionales vacíos van como `undefined` **explícito**: así, al editar, `{ ...task, ...draft }`
   * los borra de la tarea en lugar de conservar el valor antiguo.
   */
  private toDraft(): TaskDraft {
    const s = this.snapshot();
    return {
      title: s.title.trim(),
      userId: s.userId,
      completed: s.completed,
      priority: s.priority,
      description: s.description || undefined,
      startDate: s.startDate || undefined,
      endDate: s.endDate || undefined,
      tags: s.tags.length > 0 ? s.tags : undefined,
    };
  }
}
