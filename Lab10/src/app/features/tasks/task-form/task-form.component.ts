import { ChangeDetectionStrategy, Component, inject, Input, input, output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TaskDraft } from '../../../core/models/task.model';
import { UserService } from '../../../core/services/user.service';

/** Formulario reutilizado por "crear" y "editar" (template-driven con [(ngModel)]). */
@Component({
  selector: 'app-task-form',
  imports: [FormsModule],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
      <div class="field">
        <label for="title">Título</label>
        <input
          id="title"
          name="title"
          [(ngModel)]="model.title"
          #title="ngModel"
          required
          minlength="3"
          maxlength="120"
          [pattern]="notBlank"
        />
        @if (title.invalid && (title.touched || f.submitted)) {
          <small class="error">
            @if (title.errors?.['required'] || title.errors?.['pattern']) {
              El título es obligatorio.
            } @else {
              Debe tener entre 3 y 120 caracteres.
            }
          </small>
        }
      </div>

      <div class="field">
        <label for="userId">Usuario responsable</label>
        <select id="userId" name="userId" [(ngModel)]="model.userId" #user="ngModel" required>
          @for (u of users.users(); track u.id) {
            <option [ngValue]="u.id">{{ u.id }} · {{ u.name }}</option>
          }
        </select>
        @if (users.users().length === 0) {
          <small class="error">No se pudo cargar la lista de usuarios.</small>
        } @else if (user.invalid && (user.touched || f.submitted)) {
          <small class="error">Selecciona un usuario.</small>
        }
      </div>

      <div class="field field--inline">
        <label for="completed">Completado</label>
        <input id="completed" name="completed" type="checkbox" [(ngModel)]="model.completed" />
      </div>

      <div class="actions">
        <button class="btn btn-primary" type="submit" [disabled]="f.invalid">{{ submitLabel() }}</button>
        <button class="btn btn-secondary" type="button" (click)="cancelled.emit()">Cancelar</button>
      </div>
    </form>
  `,
})
export class TaskFormComponent {
  protected readonly users = inject(UserService);

  /** Valores iniciales. Se copian: editar el formulario no toca el estado hasta guardar. */
  @Input() set value(draft: TaskDraft) {
    this.model = { ...draft };
    this.initial = { ...draft };
  }
  readonly submitLabel = input('Guardar');
  readonly saved = output<TaskDraft>();
  readonly cancelled = output<void>();

  protected readonly notBlank = /\S/;
  protected model: TaskDraft = { title: '', userId: 1, completed: false };
  /** Copia de los valores de partida, para saber si el usuario ha cambiado algo. */
  private initial: TaskDraft = { ...this.model };
  private wasSubmitted = false;

  /**
   * ¿Hay cambios sin guardar? Compara con los valores de partida (si el usuario escribe y
   * borra, no cuenta) y es `false` tras guardar, para que salir después no pregunte.
   */
  hasUnsavedChanges(): boolean {
    if (this.wasSubmitted) return false;
    return (
      this.model.title !== this.initial.title ||
      this.model.userId !== this.initial.userId ||
      this.model.completed !== this.initial.completed
    );
  }

  /** Cerrar o recargar la pestaña no pasa por el router: lo cubre el aviso nativo del navegador. */
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  protected submit(form: NgForm): void {
    if (form.invalid) return;
    this.wasSubmitted = true;
    this.saved.emit({ ...this.model, title: this.model.title.trim() });
  }
}
