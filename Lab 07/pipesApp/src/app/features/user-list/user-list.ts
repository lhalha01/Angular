import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Data, User } from "../../services/data";

@Component({
  selector: "app-user-list",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-list-container">
      <h2>Lista de Usuarios</h2>

      <div class="controls">
        <button (click)="loadUsers()" class="btn btn-primary">
          Cargar Usuarios
        </button>

        <button (click)="loadUsersWithError()" class="btn btn-danger">
          Cargar con Error
        </button>

        <button (click)="clearUsers()" class="btn btn-secondary">
          Limpiar Lista
        </button>
      </div>

      <div class="search-filter">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Buscar usuarios..."
          class="form-control"
        />
      </div>

      <div class="stats">
        <p>Total usuarios: {{ users().length }}</p>
        <p>Usuarios filtrados: {{ filteredUsers().length }}</p>
        <p>Usuarios activos: {{ activeUsersCount() }}</p>
      </div>

      <div *ngIf="loading()" class="loading">
        <p>Cargando usuarios...</p>
      </div>

      <div *ngIf="error()" class="error">
        <p>Error: {{ error() }}</p>
      </div>

      <div class="user-grid">
        <div
          *ngFor="
            let user of filteredUsers();
            trackBy: trackByUserId;
            let i = index
          "
          class="user-card"
          [class.inactive]="!user.active"
        >
          <h4>{{ user.name }}</h4>
          <p>Email: {{ user.email }}</p>
          <p>Edad: {{ user.age }}</p>
          <p>Estado: {{ user.active ? "Activo" : "Inactivo" }}</p>
          <p>Índice: {{ i }}</p>

          <!-- Bug intencional: acceso a propiedad undefined -->
          <p *ngIf="user.profile">Perfil: {{ user.profile.description }}</p>

          <button
            (click)="toggleUserStatus(user)"
            class="btn btn-sm"
            [class.btn-success]="!user.active"
            [class.btn-warning]="user.active"
          >
            {{ user.active ? "Desactivar" : "Activar" }}
          </button>
        </div>
      </div>

      <div *ngIf="filteredUsers().length === 0 && !loading()" class="no-users">
        <p>No se encontraron usuarios.</p>
      </div>
    </div>
  `,
  styleUrls: ["./user-list.scss"],
})
export class UserList implements OnInit {
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = "";

  // Computed properties
  filteredUsers = computed(() => {
    const users = this.users();
    const term = this.searchTerm.toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  });

  activeUsersCount = computed(
    () => this.users().filter((user) => user.active).length
  );

  constructor(private data: Data) {}

  ngOnInit(): void {
    console.log("UserList initialized");
    this.loadUsers();
  }

  loadUsers(): void {
    console.log("Loading users...");
    this.loading.set(true);
    this.error.set(null);

    this.data.getUsers().subscribe({
      next: (users) => {
        console.log("Users loaded successfully:", users);
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("Error loading users:", error);
        this.error.set("Error al cargar usuarios");
        this.loading.set(false);
      },
    });
  }

  loadUsersWithError(): void {
    console.log("Loading users with intentional error...");
    this.loading.set(true);
    this.error.set(null);

    this.data.getUsersWithError().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("Expected error occurred:", error);
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  clearUsers(): void {
    console.log("Clearing user list");
    this.users.set([]);
    this.error.set(null);
  }

  toggleUserStatus(user: User): void {
    console.log(`Toggling status for user: ${user.name}`);

    // Bug intencional: mutar el objeto directamente
    user.active = !user.active;

    // Forzar actualización de signals
    this.users.set([...this.users()]);
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
