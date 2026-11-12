
[[_TOC_]]

# Lab 15: RxJS aplicado — TalentHub: directorio reactivo

## Objetivo

Implementar el directorio de empleados con búsqueda en tiempo real (switchMap + debounce), filtrado combinado por rol y disponibilidad (combineLatest), y protección de doble envío en el formulario de alta (exhaustMap).

## Prerequisitos

- Lab 14 completado (servicio HTTP funcionando).
- Leer el capítulo [RxJS aplicado](./Introducción.md).

---

## Fase 1 — Búsqueda reactiva en el directorio (25 min)

```typescript
// features/empleados/components/directorio/directorio.component.ts
export class DirectorioEmpleados {
  private empleadoService = inject(EmpleadoService);

  busqueda      = signal('');
  filtroRol     = signal<RolEmpleado | 'todos'>('todos');
  filtroDisp    = signal<'todos' | 'disponibles' | 'ocupados'>('todos');

  // Carga reactiva: se recarga si cambia el término de búsqueda
  private todos$ = toObservable(this.busqueda).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.empleadoService.getAll().pipe(
      map(lista => term.length >= 2
        ? lista.filter(e => e.nombre.toLowerCase().includes(term.toLowerCase()))
        : lista
      )
    ))
  );

  readonly empleados = toSignal(this.todos$, { initialValue: [] as Empleado[] });

  // Filtrado local derivado de la lista cargada
  readonly empleadosFiltrados = computed(() => {
    let lista = this.empleados();
    if (this.filtroRol()  !== 'todos')        lista = lista.filter(e => e.rol === this.filtroRol());
    if (this.filtroDisp() === 'disponibles')  lista = lista.filter(e => e.disponible);
    if (this.filtroDisp() === 'ocupados')     lista = lista.filter(e => !e.disponible);
    return lista;
  });

  readonly totalDisponibles = computed(() => this.empleados().filter(e => e.disponible).length);
}
```

---

## Fase 2 — Protección de doble envío en el formulario de alta (15 min)

```typescript
// features/empleados/components/formulario-alta/formulario-alta.component.ts
readonly submit$ = new Subject<NuevoEmpleado>();

constructor() {
  this.submit$.pipe(
    exhaustMap(datos => this.empleadoService.crear(datos)),
    takeUntilDestroyed()
  ).subscribe({
    next: () => this.router.navigate(['/empleados']),
    error: err => this.notif.error(err.message)
  });
}

onSubmit(): void {
  if (this.form.valid) {
    this.submit$.next(this.form.value as NuevoEmpleado);
  }
}
```

---

## Fase 3 — Eliminar suscripciones manuales (10 min)

Revisa todos los componentes existentes. Cambia cada `subscribe()` manual dentro de `ngOnInit` por `toSignal()` o `takeUntilDestroyed()`.

---

## Criterios de aceptación

- Escribir en el buscador no lanza una petición por cada tecla (verificar en Network: debounce 300 ms).
- Los filtros de rol y disponibilidad se combinan con la búsqueda en tiempo real.
- El botón "Dar de alta" no crea duplicados aunque se pulse varias veces rápido.
- No hay `ngOnDestroy` ni `unsubscribe()` manual en el código nuevo.

## Entregable

Rama `lab-15-rxjs`. Capturas de Network mostrando peticiones con debounce.

## Prerequisitos

- Lab 14 completado (HTTP con interceptores).
- Leer el capítulo [RxJS aplicado](./Introducción.md).

---

## Fase 1 — Buscador con switchMap y debounce (25 min)

En el componente de lista de tareas, añade un campo de búsqueda reactivo:

```typescript
export class ListaTareas {
  private tareaService = inject(TareaService);
  termino = signal('');

  // El Observable se cancela automáticamente cuando cambia el término
  readonly resultados = toSignal(
    toObservable(this.termino).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(t => t.length >= 2
        ? this.tareaService.buscar(t)
        : this.tareaService.getAll()
      )
    ),
    { initialValue: [] as Tarea[] }
  );
}
```

En el template:

```html
<input
  type="search"
  [value]="termino()"
  (input)="termino.set($any($event.target).value)"
  placeholder="Buscar tarea..."
/>
```

---

## Fase 2 — Filtrado combinado con combineLatest (20 min)

Añade filtros de estado y prioridad que se combinan con la búsqueda:

```typescript
filtroEstado    = signal<'todas' | 'completadas' | 'pendientes'>('todas');
filtroPrioridad = signal<'todas' | 'alta' | 'media' | 'baja'>('todas');

readonly tareasFiltradas = computed(() => {
  let lista = this.resultados();
  if (this.filtroEstado() === 'completadas') lista = lista.filter(t => t.completada);
  if (this.filtroEstado() === 'pendientes')  lista = lista.filter(t => !t.completada);
  if (this.filtroPrioridad() !== 'todas')    lista = lista.filter(t => t.prioridad === this.filtroPrioridad());
  return lista;
});
```

---

## Fase 3 — Protección de doble envío con exhaustMap (15 min)

En el formulario de creación, evita envíos duplicados:

```typescript
readonly submit$ = new Subject<NuevaTarea>();
constructor() {
  this.submit$.pipe(
    exhaustMap(datos => this.tareaService.crear(datos)),
    takeUntilDestroyed()
  ).subscribe({
    next: () => this.router.navigate(['/tareas']),
    error: err => this.notif.error(err.message)
  });
}
```

---

## Fase 4 — Eliminar suscripciones manuales (10 min)

Revisa todos los componentes y reemplaza cada `subscribe()` manual en el constructor o `ngOnInit` por `toSignal()`. Los que no puedan convertirse deben usar `takeUntilDestroyed()`.

---

## Criterios de aceptación

- El buscador no lanza una petición por cada tecla (verificable en Network).
- Cambiar filtros en rápida sucesión solo ejecuta la última combinación.
- El botón de submit no crea duplicados aunque se pulse varias veces rápido.
- No hay `ngOnDestroy` ni `unsubscribe()` manual en el código nuevo.
- `ng lint` sin nuevos errores.

## Entregable

Rama o commit. Captura de Network mostrando las peticiones canceladas y gif/vídeo del filtrado en acción.
