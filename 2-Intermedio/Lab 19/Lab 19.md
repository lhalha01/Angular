
[[_TOC_]]

# Lab 19: Performance y calidad — TalentHub: listo para producción

## Objetivo

Activar `OnPush` en todos los componentes de TalentHub, añadir `track` en las listas de empleados y proyectos, diferir el bloque de estadísticas del dashboard con `@defer` y dejar el proyecto con ESLint a cero errores.

## Prerequisitos

- Lab 18 completado.
- Leer el capítulo [Performance y calidad](./Introducción.md).

---

## Fase 1 — OnPush y track (20 min)

1. Añade `changeDetection: ChangeDetectionStrategy.OnPush` en **todos** los componentes.
2. Verifica que el directorio y la lista de proyectos se siguen actualizando (los Signals son compatibles con OnPush automáticamente).
3. Convierte todos los bucles al nuevo control flow con `track`:

```html
<!-- features/empleados/components/directorio/directorio.component.html -->
@for (empleado of empleadosFiltrados(); track empleado.id) {
  <app-empleado-card
    [empleado]="empleado"
    (eliminar)="facade.eliminar(empleado.id)"
  />
} @empty {
  <p class="sin-resultados">No se encontraron empleados con los filtros actuales.</p>
}
```

---

## Fase 2 — @defer en el dashboard (15 min)

```html
<!-- features/dashboard/components/dashboard/dashboard.component.html -->
<section class="stats-resumen">
  <app-stat-card titulo="Empleados" [valor]="totalEmpleados()" />
  <app-stat-card titulo="Disponibles" [valor]="disponibles()" />
  <app-stat-card titulo="Proyectos activos" [valor]="proyectosActivos()" />
</section>

@defer (on viewport; prefetch on idle) {
  <app-desglose-por-rol [totalesPorRol]="totalPorRol()" />
} @loading {
  <div class="skeleton-chart">Cargando desglose...</div>
} @placeholder {
  <div class="placeholder-chart"></div>
}
```

---

## Fase 3 — Análisis de bundle (15 min)

```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/talenthub/stats.json
```

Documenta en `AUDIT.md`:

- Tamaño total de `main.js` gzipped.
- Si el dashboard, empleados y proyectos tienen chunks separados (lazy).
- Las 3 dependencias más pesadas.

---

## Fase 4 — ESLint a cero (10 min)

```bash
ng lint --fix   # corrige lo que pueda automáticamente
ng lint          # verifica que no queda nada
```

Si quedan warnings no corregibles, docúcmentalos en `AUDIT.md` con el plan de corrección.

---

## Criterios de aceptación

- `ChangeDetectionStrategy.OnPush` en los 100% de los componentes.
- Todos los `@for` tienen `track` con ID único.
- El bloque de desglose por rol del dashboard se carga con `@defer`.
- `ng lint` a 0 errores.
- `ng test` sigue pasando después de los cambios.
- Bundle con chunks separados para `empleados`, `proyectos` y `dashboard`.

## Entregable

Rama `lab-19-performance`. Capturas: bundle analyzer, resumen de lint y score Lighthouse antes/después.

## Prerequisitos

- Lab 18 completado.
- Leer el capítulo [Performance y calidad](./Introducción.md).

---

## Fase 1 — OnPush y track en listas (20 min)

1. Añade `changeDetection: ChangeDetectionStrategy.OnPush` a todos los componentes.
2. Verifica que las vistas se siguen actualizando (los Signals son compatibles con OnPush automáticamente).
3. Asegúrate de que todos los `@for` tienen `track` con el `id` del elemento:

```html
@for (tarea of tareas(); track tarea.id) {
  <app-tarea-card [tarea]="tarea" />
}
```

---

## Fase 2 — Análisis de bundle (15 min)

```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/mi-app/stats.json
```

Documenta en el entregable:

- Tamaño total del bundle main.js (gzipped).
- Los 3 paquetes más grandes.
- Si alguna librería está duplicada.

---

## Fase 3 — @defer para bloques pesados (15 min)

Identifica un componente que no sea crítico para la carga inicial (por ejemplo, un gráfico de estadísticas o una tabla secundaria) y aplica `@defer`:

```html
@defer (on viewport; prefetch on idle) {
  <app-estadisticas-tareas [tareas]="tareas()" />
} @loading {
  <div class="skeleton">Cargando estadísticas...</div>
}
```

---

## Fase 4 — ESLint (15 min)

Si no está instalado:

```bash
ng add @angular-eslint/schematics
```

Ejecuta:

```bash
ng lint
```

Corrige todos los errores. Si hay más de 20 advertencias, corrige primero las categorías `error` y deja las `warn` documentadas en el entregable con un plan de mejora.

---

## Criterios de aceptación

- Todos los componentes tienen `ChangeDetectionStrategy.OnPush`.
- Todos los `@for` tienen `track` con ID único.
- El bundle main.js es < 250 KB gzipped (o se documenta la razón si es mayor).
- `ng lint` devuelve 0 errores (solo warnings permitidos, documentados).
- `ng test` sigue pasando después de los cambios de performance.

## Entregable

Rama o commit. Captura del bundle analyzer, del resumen de lint y del score de Lighthouse antes/después.
