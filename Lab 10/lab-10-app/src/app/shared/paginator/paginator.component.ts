import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PAGE_SIZES, PageSize } from './pagination';

/**
 * Paginador genérico: selector "Por página" y botones Anterior/Siguiente.
 * Solo muestra el estado y avisa de los cambios (`page`/`pageSize` son `model()`);
 * quien lo usa decide qué hacer con ellos, p. ej. con `paginate()`.
 */
@Component({
  selector: 'app-paginator',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination">
      <label class="page-size">
        Por página
        <select [ngModel]="pageSize()" (ngModelChange)="pageSize.set($event)">
          @for (size of pageSizes(); track size) {
            <option [ngValue]="size">{{ size === 'all' ? 'Todos' : size }}</option>
          }
        </select>
      </label>

      @if (totalPages() > 1) {
        <nav class="pager" aria-label="Paginación">
          <button type="button" class="btn btn-secondary" [disabled]="page() <= 1" (click)="page.set(page() - 1)">‹ Anterior</button>
          <span>Página {{ page() }} de {{ totalPages() }}</span>
          <button type="button" class="btn btn-secondary" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">Siguiente ›</button>
        </nav>
      }
    </div>
  `,
  styles: `
    .pagination { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 1rem 2rem; margin-top: 1.5rem; color: var(--text-muted); }
    .page-size { display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; }
    .page-size select { padding: 0.5rem 0.7rem; }
    .pager { display: flex; align-items: center; gap: 1rem; }
  `,
})
export class PaginatorComponent {
  /** Página actual (base 1). */
  readonly page = model.required<number>();
  readonly pageSize = model.required<PageSize>();
  readonly totalPages = input.required<number>();
  readonly pageSizes = input<readonly PageSize[]>(PAGE_SIZES);
}
