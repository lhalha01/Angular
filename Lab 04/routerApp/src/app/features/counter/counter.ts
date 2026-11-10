import { Component, signal, computed, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-counter",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="counter-container">
      <h2>Contador de Debug</h2>

      <div class="counter-display">
        <p>
          Valor actual: <strong>{{ count() }}</strong>
        </p>
        <p>
          Valor doble: <strong>{{ doubleCount() }}</strong>
        </p>
        <p>
          ¿Es par?: <strong>{{ isEven() ? "Sí" : "No" }}</strong>
        </p>
      </div>

      <div class="counter-controls">
        <button
          (click)="increment()"
          [disabled]="count() >= maxValue"
          class="btn btn-primary"
        >
          Incrementar (+1)
        </button>

        <button
          (click)="decrement()"
          [disabled]="count() <= 0"
          class="btn btn-secondary"
        >
          Decrementar (-1)
        </button>

        <button (click)="incrementBy(stepValue)" class="btn btn-info">
          Incrementar (+{{ stepValue }})
        </button>

        <button (click)="reset()" class="btn btn-warning">Reset</button>
      </div>

      <div class="step-control">
        <label for="step">Paso personalizado:</label>
        <input
          id="step"
          type="number"
          [(ngModel)]="stepValue"
          min="1"
          max="10"
          class="form-control"
        />
      </div>

      <div class="debug-info">
        <h4>Debug Info:</h4>
        <pre>{{ getDebugInfo() | json }}</pre>
      </div>

      <!-- Bug intencional: división por cero -->
      <div *ngIf="count() > 0" class="calculation">
        <p>100 dividido por count: {{ 100 / (count() - count()) }}</p>
      </div>
    </div>
  `,
  styleUrls: ["./counter.scss"],
})
export class Counter implements OnInit, OnDestroy {
  count = signal(0);
  stepValue = 1;
  maxValue = 20;

  // Bug: memoria leak con setInterval
  private intervalId?: number;

  // Computed properties
  doubleCount = computed(() => this.count() * 2);
  isEven = computed(() => this.count() % 2 === 0);

  ngOnInit(): void {
    console.log("Counter initialized");

    // Bug intencional: setInterval sin cleanup
    this.intervalId = window.setInterval(() => {
      console.log("Interval running...", this.count());
    }, 5000);

    // Debug: Log inicial
    this.debugLog("Component initialized");
  }

  ngOnDestroy(): void {
    console.log("Counter destroyed");

    // Fix del memory leak
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  increment(): void {
    this.debugLog("Incrementing count");

    if (this.count() < this.maxValue) {
      this.count.update((value) => value + 1);
    } else {
      console.warn("Maximum value reached!");
    }
  }

  decrement(): void {
    this.debugLog("Decrementing count");

    if (this.count() > 0) {
      this.count.update((value) => value - 1);
    } else {
      console.warn("Minimum value reached!");
    }
  }

  incrementBy(step: number): void {
    this.debugLog(`Incrementing by ${step}`);

    // Bug intencional: no validar el tipo
    const newValue = this.count() + step;

    if (newValue <= this.maxValue) {
      this.count.set(newValue);
    } else {
      console.error("Would exceed maximum value");
    }
  }

  reset(): void {
    this.debugLog("Resetting counter");
    this.count.set(0);
  }

  getDebugInfo(): object {
    return {
      currentValue: this.count(),
      doubleValue: this.doubleCount(),
      isEven: this.isEven(),
      stepValue: this.stepValue,
      maxValue: this.maxValue,
      timestamp: new Date().toISOString(),
    };
  }

  private debugLog(message: string): void {
    console.group(`🔍 Counter Debug`);
    console.log(`📝 ${message}`);
    console.log(`📊 Current state:`, this.getDebugInfo());
    console.trace("Stack trace");
    console.groupEnd();
  }
}
