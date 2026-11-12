import { Component } from '@angular/core';

/** Pie de página de TalentHub. */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly anio = new Date().getFullYear();
}
