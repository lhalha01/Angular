
[[_TOC_]]

# Lab 19.1: Performance y calidad — TalentHub: listo para producción

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
