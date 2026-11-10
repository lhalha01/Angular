import { Component } from '@angular/core';
import { ControlFlow } from '../../components/control-flow/control-flow';
import { DirectivesAttribute } from '../../components/directives-attribute/directives-attribute';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-directives',
  imports: [CommonModule, ControlFlow, DirectivesAttribute],
  template: `
<div class="container">
  <header>
    <h1>{{ title }}</h1>
    <p>Aprendiendo las nuevas directivas de Angular 18+</p>
  </header>
  <nav class="navigation">
    <button
      *ngFor="let tab of tabs; let i = index"
      (click)="activeTab = i"
      [class.active]="activeTab === i"
    >
      {{ tab }}
    </button>

  </nav>
  <main>
    @switch (activeTab) { @case (0) {
    <app-control-flow />
    } @case (1) {
    <app-directives-attribute />
    } }
  </main>
</div>
  `,
  styleUrl: './directives.scss',
})
export class Directives {
  title = 'Directivas Modernas Angular';
  activeTab = 0;
  tabs = ['Control de Flujo', 'Directivas de Atributo'];
}
