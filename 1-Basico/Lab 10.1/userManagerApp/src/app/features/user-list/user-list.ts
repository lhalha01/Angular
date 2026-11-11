import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HighlightEven } from '../../directives/highlight-even';
import { UserInterface } from '../../interfaces/user';
import { FilterUsersPipe } from '../../pipes/filter-users-pipe';
import { FullNamePipe } from '../../pipes/full-name-pipe';
import { UserActions } from '../../services/user-actions';
import { User } from '../../services/user';

@Component({
  selector: 'app-user-list',
  imports: [FormsModule, RouterLink, DatePipe, UpperCasePipe, FullNamePipe, HighlightEven],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  private readonly userService = inject(User);
  private readonly actions = inject(UserActions);
  // El pipe de filtrado se usa también desde TypeScript para poder paginar el resultado filtrado.
  private readonly filterPipe = new FilterUsersPipe();

  protected readonly pageSize = 5;
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly term = signal('');
  private readonly requestedPage = signal(1);

  protected readonly filtered = computed(() =>
    this.filterPipe.transform(this.userService.users(), this.term()),
  );
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );
  // Se acota al rango válido: si se borra el último usuario de la última página, retrocede sola.
  protected readonly page = computed(() => Math.min(this.requestedPage(), this.totalPages()));
  protected readonly pageItems = computed<UserInterface[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });
  protected readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.userService.getUsers().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  protected onSearch(value: string): void {
    this.term.set(value);
    this.requestedPage.set(1); // al cambiar el filtro se vuelve a la primera página
  }

  protected goTo(page: number): void {
    this.requestedPage.set(page);
  }

  protected onDelete(user: UserInterface): void {
    // Avisa de las tareas que se borrarán con él, confirma, borra y notifica (véase UserActions).
    this.actions.remove(user).subscribe();
  }
}
