import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
}

@Component({
  selector: "app-welcome",
  imports: [CommonModule, FormsModule],
  templateUrl: "./welcome.html",
  styleUrls: ["./welcome.scss"],
})
export class Welcome {
  // Signals para estado reactivo
  currentTime = signal(new Date());
  visitCount = signal(0);

  // Props de entrada
  @Input() user: User | null = null;
  @Input() showPersonalizedMessage = true;

  // Eventos de salida
  @Output() userInteraction = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  // Computed properties
  greeting = computed(() => {
    const hour = this.currentTime().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  });

  timeString = computed(() => {
    return this.currentTime().toLocaleTimeString("es-ES");
  });

  userDisplayName = computed(() => {
    return this.user?.name || "Invitado";
  });

  constructor() {
    // Actualizar hora cada segundo
    setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    // Incrementar contador de visitas
    this.visitCount.update((count) => count + 1);
  }

  onButtonClick(action: string) {
    this.userInteraction.emit(action);

    if (action === "logout") {
      this.logout.emit();
    }
  }

  incrementVisits() {
    this.visitCount.update((count) => count + 1);
  }

  getRoleColor(): string {
    if (!this.user) return "gray";

    switch (this.user.role) {
      case "admin":
        return "red";
      case "user":
        return "blue";
      case "guest":
        return "green";
      default:
        return "gray";
    }
  }
}
