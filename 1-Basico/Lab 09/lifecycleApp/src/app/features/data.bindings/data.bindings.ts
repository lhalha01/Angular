import { Component } from '@angular/core';
import { Interpolacion } from '../../components/interpolacion/interpolacion';
import { PropertyBinding } from '../../components/property-binding/property-binding';
import { EventBinding } from '../../components/event-binding/event-binding';
import { TwoWayBinding } from '../../components/two-way-binding/two-way-binding';

@Component({
  selector: 'app-data-bindings',
  imports: [Interpolacion, PropertyBinding, EventBinding, TwoWayBinding],
  template: `
    <div class="container">
      <h1>{{ title }}</h1>
      <section class="binding-section">
        <h2>1. Interpolación</h2>
        <app-interpolacion></app-interpolacion>
      </section>
      <hr />
      <section class="binding-section">
        <h2>2. Property Binding</h2>
        <app-property-binding></app-property-binding>
      </section>
      <hr />
      <section class="binding-section">
        <h2>3. Event Binding</h2>
        <app-event-binding></app-event-binding>
      </section>
      <hr />
      <section class="binding-section">
        <h2>4. Two-way Binding</h2>
        <app-two-way-binding></app-two-way-binding>
      </section>
    </div>
  `,

  styles: [
    `
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: Arial, sans-serif;
      }

      .binding-section {
        margin: 2rem 0;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }

      hr {
        margin: 2rem 0;
        border: none;
        border-top: 2px solid #eee;
      }

      h1 {
        color: #333;
        text-align: center;
      }

      h2 {
        color: #666;
        border-bottom: 2px solid #007acc;
        padding-bottom: 0.5rem;
      }
    `,
  ],
})
export class DataBindings {
  title = 'DataBindings en Angular';
}
