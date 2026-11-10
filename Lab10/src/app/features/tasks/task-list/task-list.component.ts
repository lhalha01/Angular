import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Task, TaskFilter } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { HighlightUserDirective } from '../../../shared/directives/highlight-user.directive';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';

@Component({
  selector: 'app-task-list',
  imports: [FormsModule, RouterLink, HighlightUserDirective, TaskStatusPipe, UpperCasePipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="topbar">
        <div>
          <p class="eyebrow">Lista de tareas</p>
          <h2>Tu tablero</h2>
        </div>

        <label class="filter">
          Filtrar por estado
          <select [ngModel]="filter()" (ngModelChange)="filter.set($event)">
            <option value="all">Todos</option>
            <option value="completed">Completadas</option>
            <option value="pending">Pendientes</option>
          </select>
        </label>
      </div>

      @switch (status()) {
        @case ('loading') {
          <div class="card state">Cargando tareas...</div>
        }
        @case ('error') {
          <div class="card state">
            No se pudieron cargar las tareas.
            <div class="actions"><button class="btn btn-secondary" (click)="retry()">Reintentar</button></div>
          </div>
        }
        @default {
          @if (filteredTasks().length === 0) {
            <div class="card state">No hay tareas para mostrar.</div>
          } @else {
            <div class="task-list">
              @for (task of filteredTasks(); track task.id) {
                <article class="card">
                  <div class="task-header">
                    <div>
                      <p class="meta">#{{ task.id }} · Usuario {{ task.userId }}</p>
                      <h3>{{ task.title | uppercase }}</h3>
                    </div>
                    <span class="status" [class.completed]="task.completed">{{ task.completed | taskStatus }}</span>
                  </div>

                  <div class="task-body">
                    <p>Responsable: <span [appHighlightUser]="userName(task.userId)">{{ userName(task.userId) }}</span></p>
                    <p>Creada: {{ task.createdAt | date: 'dd/MM/yyyy' }}</p>
                  </div>

                  <div class="actions">
                    <a class="btn btn-secondary" [routerLink]="[task.id]">Ver detalle</a>
                    <button class="btn btn-secondary" (click)="edit(task)">Editar</button>
                    <button class="btn btn-danger" (click)="remove(task)">Eliminar</button>
                  </div>
                </article>
              }
            </div>
          }
        }
      }
    </section>
  `,
  styles: `
    .panel { max-width: 1100px; margin: 2.5rem auto; padding: 1.5rem; }
    .topbar { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    h2 { margin: 0.35rem 0 0; font-size: 2rem; }
    .filter { display: flex; flex-direction: column; gap: 0.4rem; color: #cbd5e1; font-size: 0.9rem; }
    .task-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
    .task-header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    .meta { color: #93c5fd; margin: 0 0 0.4rem; }
    h3 { margin: 0; color: #f8fafc; }
    .status { display: inline-block; padding: 0.4rem 0.7rem; border-radius: 999px; background: rgba(251, 191, 36, 0.14); color: #fbbf24; font-size: 0.76rem; font-weight: 700; white-space: nowrap; }
    .status.completed { background: rgba(34, 197, 94, 0.16); color: #4ade80; }
    .task-body { margin-top: 1rem; color: #cbd5e1; }
    .task-body p { margin: 0.25rem 0; }
  `,
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  protected readonly status = this.taskService.status;
  protected readonly filter = signal<TaskFilter>('all');

  protected readonly filteredTasks = computed(() => {
    const tasks = this.taskService.tasks();
    switch (this.filter()) {
      case 'completed':
        return tasks.filter((t) => t.completed);
      case 'pending':
        return tasks.filter((t) => !t.completed);
      default:
        return tasks;
    }
  });

  protected userName(userId: number): string {
    return this.userService.nameOf(userId);
  }

  protected edit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  protected remove(task: Task): void {
    // Confirmación explícita antes de una acción destructiva.
    if (!window.confirm(`¿Seguro que quieres eliminar "${task.title}"?`)) return;
    this.taskService.deleteTask(task.id).subscribe();
  }

  protected retry(): void {
    this.taskService.reload();
  }
}
