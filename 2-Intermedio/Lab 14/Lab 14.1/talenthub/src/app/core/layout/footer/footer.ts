import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pie de página de TalentHub. */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly anio = new Date().getFullYear();
}
