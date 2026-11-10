import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TaskDraft } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-add-task',
  imports: [TaskFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card card--narrow">
      <p class="eyebrow">Nueva tarea</p>
      <h2>Crear tarea</h2>
      <app-task-form submitLabel="Guardar tarea" (saved)="create($event)" (cancelled)="back()" />
    </section>
  `,
})
export class AddTaskComponent {
  private readonly tasks = inject(TaskService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected create(draft: TaskDraft): void {
    this.tasks.addTask(draft).subscribe((task) => {
      this.toast.show(`Tarea #${task.id} creada`);
      this.back();
    });
  }

  protected back(): void {
    this.router.navigate(['/tasks']);
  }
}
