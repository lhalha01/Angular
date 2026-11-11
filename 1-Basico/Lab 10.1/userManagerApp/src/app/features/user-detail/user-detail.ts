import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserInterface } from '../../interfaces/user';
import { FullNamePipe } from '../../pipes/full-name-pipe';
import { User } from '../../services/user';
import { UserActions } from '../../services/user-actions';

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, DatePipe, UpperCasePipe, FullNamePipe],
  template: `
    <a class="back" routerLink="/users">← Volver a la lista</a>

    @if (loading()) {
      <p class="status">Cargando usuario…</p>
    } @else if (user(); as u) {
      <article class="card detail">
        <img class="avatar" [src]="u.avatar" [alt]="'Avatar de ' + u.firstName + ' ' + u.lastName" width="128" height="128" />
        <div class="data">
          <h1>{{ u | fullName }}</h1>
          <dl>
            <dt>ID</dt><dd>{{ u.id }}</dd>
            <dt>Nombre</dt><dd>{{ u.firstName | uppercase }}</dd>
            <dt>Apellidos</dt><dd>{{ u.lastName | uppercase }}</dd>
            <dt>Email</dt><dd>{{ u.email }}</dd>
            <dt>Teléfono</dt><dd>{{ u.phone || '—' }}</dd>
            <dt>Ciudad</dt><dd>{{ u.city || '—' }}</dd>
            <dt>Empresa</dt><dd>{{ u.company || '—' }}</dd>
            <dt>Web</dt><dd>{{ u.website || '—' }}</dd>
            <dt>Fecha de alta</dt><dd>{{ u.createdAt | date: 'longDate' }}</dd>
          </dl>
          <div class="actions">
            <a class="btn btn-primary" [routerLink]="['/users', u.id, 'edit']">Editar</a>
            <button type="button" class="btn btn-danger" (click)="onDelete(u)">Eliminar</button>
          </div>
        </div>
      </article>
    } @else {
      <p class="status">El usuario solicitado no existe.</p>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 1rem; }
    .status { padding: 2rem 0; text-align: center; color: var(--muted); }
    .detail { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
    .avatar { border-radius: 50%; background: var(--border); }
    .data { flex: 1; min-width: 240px; }
    h1 { margin-top: 0; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.35rem 1rem; }
    dt { font-weight: 600; color: var(--muted); }
    dd { margin: 0; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; }
  `,
})
export class UserDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(User);
  private readonly actions = inject(UserActions);

  protected readonly loading = signal(true);
  protected readonly user = signal<UserInterface | undefined>(undefined);

  ngOnInit(): void {
    // El id llega como parámetro de ruta (/users/:id).
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUser(id).subscribe((user) => {
      this.user.set(user);
      this.loading.set(false);
    });
  }

  protected onDelete(user: UserInterface): void {
    // Avisa de las tareas que se borrarán con él, confirma, borra y notifica (véase UserActions).
    this.actions.remove(user).subscribe((deleted) => {
      if (deleted) {
        this.router.navigate(['/users']);
      }
    });
  }
}
