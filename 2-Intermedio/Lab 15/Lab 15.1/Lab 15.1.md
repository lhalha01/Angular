
[[_TOC_]]

# Lab 15.1: RxJS aplicado — TalentHub: directorio reactivo

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
