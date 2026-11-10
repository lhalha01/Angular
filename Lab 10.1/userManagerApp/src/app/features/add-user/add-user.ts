import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserFormData } from '../../interfaces/user';
import { Notifier } from '../../services/notification';
import { User } from '../../services/user';
import { UserForm } from '../user-form/user-form';

@Component({
  selector: 'app-add-user',
  imports: [RouterLink, UserForm],
  template: `
    <a class="back" routerLink="/users">← Volver a la lista</a>
    <h1>Añadir usuario</h1>
    <app-user-form submitLabel="Crear usuario" (submitted)="onSubmit($event)" />
  `,
  styles: `.back { display: inline-block; margin-bottom: 1rem; }`,
})
export class AddUser {
  private readonly userService = inject(User);
  private readonly notifier = inject(Notifier);
  private readonly router = inject(Router);

  protected onSubmit(data: UserFormData): void {
    this.userService.addUser(data).subscribe({
      next: (user) => {
        this.notifier.show(`Usuario ${user.firstName} ${user.lastName} creado`);
        this.router.navigate(['/users']);
      },
      error: () => this.notifier.show('No se pudo crear el usuario', 'error'),
    });
  }
}
