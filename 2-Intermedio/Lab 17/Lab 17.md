
[[_TOC_]]

# Lab 17: Estado de aplicación — TalentHub: EmpleadosFacade

## Objetivo

Centralizar el estado de la feature `empleados` en un `EmpleadoStateService` con Signals y exponerlo al resto de la aplicación a través de una `EmpleadosFacade`. Los componentes no interactuarán directamente con el servicio HTTP.

## Prerequisitos

- Lab 16 completado.
- Leer el capítulo [Estado de aplicación](./Introducción.md).

---

## Fase 1 — EmpleadoStateService (25 min)

```typescript
// features/empleados/services/empleado-state.service.ts
@Injectable({ providedIn: 'root' })
export class EmpleadoStateService {
  private readonly _empleados  = signal<Empleado[]>([]);
  private readonly _cargando   = signal(false);
  private readonly _error      = signal<string | null>(null);

  readonly empleados   = this._empleados.asReadonly();
  readonly cargando    = this._cargando.asReadonly();
  readonly error       = this._error.asReadonly();

  readonly disponibles = computed(() => this._empleados().filter(e => e.disponible));
  readonly ocupados    = computed(() => this._empleados().filter(e => !e.disponible));
  readonly totalPorRol = computed(() =>
    this._empleados().reduce((acc, e) => {
      acc[e.rol] = (acc[e.rol] ?? 0) + 1;
      return acc;
    }, {} as Record<RolEmpleado, number>)
  );

  setEmpleados(lista: Empleado[]): void { this._empleados.set(lista); }
  setCargando(v: boolean): void         { this._cargando.set(v); }
  setError(msg: string | null): void    { this._error.set(msg); }

  agregar(e: Empleado): void    { this._empleados.update(l => [...l, e]); }
  eliminar(id: number): void    { this._empleados.update(l => l.filter(e => e.id !== id)); }
  actualizar(e: Empleado): void { this._empleados.update(l => l.map(x => x.id === e.id ? e : x)); }
}
```

---

## Fase 2 — EmpleadosFacade (20 min)

```typescript
// features/empleados/services/empleados.facade.ts
@Injectable({ providedIn: 'root' })
export class EmpleadosFacade {
  private state   = inject(EmpleadoStateService);
  private service = inject(EmpleadoService);
  private notif   = inject(NotificacionService);

  // Estado (solo lectura para los componentes)
  readonly empleados   = this.state.empleados;
  readonly cargando    = this.state.cargando;
  readonly disponibles = this.state.disponibles;
  readonly totalPorRol = this.state.totalPorRol;

  cargar(): void {
    this.state.setCargando(true);
    this.service.getAll().subscribe({
      next:  lista => { this.state.setEmpleados(lista); this.state.setCargando(false); },
      error: err   => { this.state.setError(err.message); this.state.setCargando(false); }
    });
  }

  async darDeAlta(datos: NuevoEmpleado): Promise<void> {
    const nuevo = await lastValueFrom(this.service.crear(datos));
    this.state.agregar(nuevo);
    this.notif.exito(`${nuevo.nombre} incorporado correctamente`);
  }

  async eliminar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.eliminar(id));
      this.state.eliminar(id);
    } catch { this.notif.error('No se pudo eliminar el empleado'); }
  }
}
```

---

## Fase 3 — Actualizar componentes (10 min)

Sustituye las inyecciones directas de `EmpleadoService` en los componentes por `EmpleadosFacade`.

---

## Criterios de aceptación

- Los componentes solo inyectan `EmpleadosFacade`.
- `disponibles`, `ocupados` y `totalPorRol` son `computed()` en el StateService.
- Dar de alta un empleado actualiza la lista sin recargar desde la API.
- `ng build` sin regresiones de tamaño.

## Entregable

Rama `lab-17-estado`. Captura de Angular DevTools mostrando los Signals del StateService.

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
