[[_TOC_]]

# Lab 17.2: Estado de aplicación — TareasFacade en la aplicación de tareas

> Extraído de `../Lab 17.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 16.2](../../Lab%2016/Lab%2016.2/Lab%2016.2.md).

## Prerequisitos

- Lab 16 completado.
- Leer el capítulo [Estado de aplicación](./Introducción.md).

---

## Fase 1 — TareaStateService con Signals (25 min)

```typescript
// features/tareas/services/tarea-state.service.ts
@Injectable({ providedIn: 'root' })
export class TareaStateService {
  private http = inject(TareaService);

  private readonly _tareas   = signal<Tarea[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error    = signal<string | null>(null);

  readonly tareas   = this._tareas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error    = this._error.asReadonly();

  readonly pendientes  = computed(() => this._tareas().filter(t => !t.completada));
  readonly completadas = computed(() => this._tareas().filter(t => t.completada));
  readonly total       = computed(() => this._tareas().length);

  cargar(): void {
    this._cargando.set(true);
    this.http.getAll().subscribe({
      next:  ts  => { this._tareas.set(ts); this._cargando.set(false); },
      error: err => { this._error.set(err.message); this._cargando.set(false); }
    });
  }

  agregar(tarea: Tarea): void {
    this._tareas.update(lista => [...lista, tarea]);
  }

  actualizar(tarea: Tarea): void {
    this._tareas.update(lista => lista.map(t => t.id === tarea.id ? tarea : t));
  }

  eliminar(id: number): void {
    this._tareas.update(lista => lista.filter(t => t.id !== id));
  }
}
```

---

## Fase 2 — TareasFacade (20 min)

```typescript
// features/tareas/services/tareas.facade.ts
@Injectable({ providedIn: 'root' })
export class TareasFacade {
  private state   = inject(TareaStateService);
  private service = inject(TareaService);
  private notif   = inject(NotificacionService);

  readonly tareas      = this.state.tareas;
  readonly cargando    = this.state.cargando;
  readonly pendientes  = this.state.pendientes;
  readonly total       = this.state.total;

  cargar(): void { this.state.cargar(); }

  async crear(datos: NuevaTarea): Promise<void> {
    const nueva = await lastValueFrom(this.service.crear(datos));
    this.state.agregar(nueva);
    this.notif.exito('Tarea creada correctamente');
  }

  async eliminar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.eliminar(id));
      this.state.eliminar(id);
    } catch {
      this.notif.error('No se pudo eliminar la tarea');
    }
  }
}
```

---

## Fase 3 — Actualizar componentes para usar la Facade (15 min)

Sustituye todas las inyecciones directas de `TareaService` y `TareaStateService` en los componentes por `TareasFacade`.

```typescript
export class ListaTareas {
  private facade = inject(TareasFacade);
  readonly tareas     = this.facade.tareas;
  readonly pendientes = this.facade.pendientes;
  constructor() { this.facade.cargar(); }
}
```

---

## Criterios de aceptación

- Los componentes solo inyectan `TareasFacade`; no acceden directamente a `TareaService` ni a `TareaStateService`.
- El estado derivado (`pendientes`, `completadas`, `total`) se calcula con `computed()`.
- Crear y eliminar tareas actualiza la vista sin recargar desde la API.
- `ng build --stats-json` no muestra regresiones de tamaño.

## Entregable

Rama o commit. Captura del árbol de componentes en Angular DevTools mostrando los Signals.
