import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="card hero__content">
        <p class="eyebrow">Gestor inteligente</p>
        <h1>Bienvenido a tu panel de tareas</h1>
        <p class="lead">
          Organiza tus pendientes, supervisa el estado de cada tarea y mantén el foco en lo importante.
        </p>
        <div class="actions">
          <a routerLink="/tasks" class="btn btn-primary">Ver tareas</a>
          <a routerLink="/add-task" class="btn btn-secondary">Crear tarea</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { min-height: 70vh; display: grid; place-items: center; padding: 2rem; }
    .hero__content { max-width: 720px; text-align: center; padding: 3rem 2rem; }
    h1 { font-size: clamp(2.2rem, 4vw, 3.6rem); margin: 0.8rem 0 1rem; color: var(--text-strong); }
    .lead { color: var(--text-muted); font-size: 1.05rem; }
    .actions { justify-content: center; margin-top: 2rem; }
  `,
})
export class HomeComponent {}
