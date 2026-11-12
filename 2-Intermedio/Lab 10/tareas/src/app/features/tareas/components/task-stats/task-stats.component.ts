import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Task } from '../../models/task.model';

/**
 * Estadísticas de las tareas: totales, pendientes y completadas, el porcentaje completado y el reparto por prioridad.
 * No es crítico para el primer pintado: la lista lo carga con `@defer` cuando entra en pantalla.
 */
@Component({
  selector: 'app-task-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stats" aria-labelledby="stats-title">
      <h3 id="stats-title">Estadísticas</h3>
      <dl class="totals">
        <div><dt>Total</dt><dd class="total">{{ stats().total }}</dd></div>
        <div><dt>Pendientes</dt><dd class="pending">{{ stats().pending }}</dd></div>
        <div><dt>Completadas</dt><dd class="completed">{{ stats().completed }}</dd></div>
        <div><dt>Progreso</dt><dd class="progress">{{ stats().percent }} %</dd></div>
      </dl>
      <ul class="priorities">
        @for (row of stats().byPriority; track row.priority) {
          <li>
            <span class="label">{{ row.label }}</span>
            <span class="bar" aria-hidden="true"><span class="fill fill--{{ row.priority }}" [style.width.%]="row.share"></span></span>
            <span class="count">{{ row.count }}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .stats { margin-top: 1.5rem; padding: 1rem 1.25rem; border: 1px solid var(--border, #cbd5e1); border-radius: 0.75rem; }
    h3 { margin: 0 0 0.75rem; font-size: 1.05rem; }
    .totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: 0.75rem; margin: 0 0 1rem; }
    .totals div { display: grid; gap: 0.1rem; }
    dt { color: var(--text-dim, #475569); font-size: 0.85rem; }
    dd { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .priorities { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
    .priorities li { display: grid; grid-template-columns: 5rem 1fr 2.5rem; align-items: center; gap: 0.75rem; }
    .bar { height: 0.55rem; border-radius: 999px; background: rgba(148, 163, 184, 0.3); overflow: hidden; }
    .fill { display: block; height: 100%; }
    .fill--high { background: #dc2626; }
    .fill--medium { background: #d97706; }
    .fill--low { background: #16a34a; }
    .count { text-align: right; font-variant-numeric: tabular-nums; }
  `,
})
export class TaskStatsComponent {
  readonly tasks = input.required<Task[]>();

  protected readonly stats = computed(() => {
    const tasks = this.tasks();
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const levels = [
      { priority: 'high', label: 'Alta' },
      { priority: 'medium', label: 'Media' },
      { priority: 'low', label: 'Baja' },
    ] as const;
    return {
      total,
      completed,
      pending: total - completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      byPriority: levels.map(({ priority, label }) => {
        const count = tasks.filter((task) => task.priority === priority).length;
        return { priority, label, count, share: total === 0 ? 0 : (count / total) * 100 };
      }),
    };
  });
}
