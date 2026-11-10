import { Component, OnInit, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserFormData } from '../../interfaces/user';

/**
 * Formulario reutilizable (alta y edición) basado en formularios de plantilla:
 * cada campo usa [(ngModel)] y sus validadores (required, email, minlength, pattern).
 */
@Component({
  selector: 'app-user-form',
  imports: [FormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnInit {
  /** Valores iniciales (vacíos para un alta, los del usuario para una edición). */
  readonly initial = input<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    company: '',
    website: '',
  });
  readonly submitLabel = input('Guardar');
  readonly submitted = output<UserFormData>();

  // Copia de trabajo: no se modifica el usuario original hasta enviar el formulario.
  protected model!: UserFormData;

  // Teléfono opcional. Admite los formatos de la API ("1-770-736-8031 x56442", "210.067.6132"):
  // dígitos, espacios, + - ( ) . y la "x" de extensión. Web opcional, con o sin http(s)://
  protected readonly phonePattern = '^[0-9+().\\-xX ]{6,25}$';
  protected readonly websitePattern = '^(https?://)?[\\w.-]+\\.[a-zA-Z]{2,}(/.*)?$';

  ngOnInit(): void {
    this.model = { ...this.initial() };
  }

  protected onSubmit(): void {
    this.submitted.emit({
      ...this.model,
      firstName: this.model.firstName.trim(),
      lastName: this.model.lastName.trim(),
      email: this.model.email.trim(),
    });
  }
}
