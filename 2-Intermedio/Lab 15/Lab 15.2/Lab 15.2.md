[[_TOC_]]

# Lab 15.2: RxJS aplicado — búsqueda y filtros reactivos en la aplicación de tareas

> Extraído de `../Lab 15.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 14.2](../../Lab%2014/Lab%2014.2/Lab%2014.2.md).

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
