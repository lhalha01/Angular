import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserFormData, UserInterface } from '../../interfaces/user';
import { Notifier } from '../../services/notification';
import { User } from '../../services/user';
import { UserForm } from '../user-form/user-form';

/** Ruta anidada /users/:id/edit: reutiliza el formulario con los datos del usuario. */
@Component({
  selector: 'app-user-edit',
  imports: [RouterLink, UserForm],
  template: `
    <a class="back" [routerLink]="['/users', id]">← Volver al detalle</a>
    <h1>Editar usuario</h1>

    @if (loading()) {
      <p class="status">Cargando usuario…</p>
    } @else if (user(); as u) {
      <app-user-form
        [initial]="toFormData(u)"
        submitLabel="Guardar cambios"
        (submitted)="onSubmit($event)"
      />
    } @else {
      <p class="status">El usuario solicitado no existe.</p>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 1rem; }
    .status { padding: 2rem 0; text-align: center; color: var(--muted); }
  `,
})
export class UserEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(User);
  private readonly notifier = inject(Notifier);

  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly loading = signal(true);
  protected readonly user = signal<UserInterface | undefined>(undefined);

  ngOnInit(): void {
    this.userService.getUser(this.id).subscribe((user) => {
      this.user.set(user);
      this.loading.set(false);
    });
  }

  protected toFormData(u: UserInterface): UserFormData {
    return {
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      city: u.city,
      company: u.company,
      website: u.website,
    };
  }

  protected onSubmit(data: UserFormData): void {
    this.userService.updateUser(this.id, data).subscribe({
      next: (user) => {
        this.notifier.show(`Usuario ${user.firstName} ${user.lastName} actualizado`);
        this.router.navigate(['/users', this.id]);
      },
      error: () => this.notifier.show('No se pudo actualizar el usuario', 'error'),
    });
  }
}
