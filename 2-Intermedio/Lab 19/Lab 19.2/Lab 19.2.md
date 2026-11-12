[[_TOC_]]

# Lab 19.2: Performance y calidad — aplicación de tareas

> Extraído de `../Lab 19.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 18.2](../../Lab%2018/Lab%2018.2/Lab%2018.2.md).

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
