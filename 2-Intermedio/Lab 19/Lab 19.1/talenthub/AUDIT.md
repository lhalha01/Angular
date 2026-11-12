# Auditoría de rendimiento y calidad de TalentHub (Lab 19.1)

Resultados reales de `ng build --stats-json` (build de producción), `ng lint` y Lighthouse 12 (escritorio, página
`/dashboard` con la sesión iniciada, mediana de 3 ejecuciones), medidos antes (Lab 18.1) y después (Lab 19.1). Las
imágenes están en [`../evidencias/`](../evidencias/).

## Bundle

El builder `@angular/build` (esbuild) no genera el `stats.json` de webpack, así que `webpack-bundle-analyzer` no lo lee:
el análisis se hizo con el metafile de esbuild que escribe `--stats-json` y con los archivos de `dist/`
([`bundle-analisis.png`](../evidencias/bundle-analisis.png)). Los tamaños gzip son de `gzip -9`; la tabla de `ng build` da
una estimación menor (89,64 kB frente a 99,54 kB).

| Medida | Antes (18.1) | Después (19.1) |
| --- | --- | --- |
| `main.js` (sin comprimir / gzip) | 3,83 kB / 1,89 kB | 3,83 kB / 1,89 kB |
| Total inicial (sin comprimir) | 298,20 kB | 306,84 kB (+8,64 kB) |
| Total inicial (gzip) | 96,57 kB | 99,54 kB (+2,97 kB) |

- **`main.js` pesa 1,89 kB gzip**, muy por debajo de los 250 kB del criterio del Lab 19.2; el total inicial (con el
  runtime de Angular y los polyfills) es 99,54 kB gzip.
- **El total inicial sube 8,6 kB** y la causa es `@defer`: su runtime (`@angular/core`, `debug_node.mjs`: +8,57 kB) entra en
  el bundle inicial en cuanto algún componente lo usa. Es el precio fijo de la técnica; lo que se difiere (el desglose por
  rol, 1,72 kB) es poco. `@defer` compensa con bloques pesados, no con uno pequeño como este.
- **Chunks separados (lazy) para las tres features:**

| Feature | Chunk | Tamaño | gzip |
| --- | --- | --- | --- |
| `dashboard` | `chunk-YQWJUUCF.js` | 3,06 kB | 1,37 kB |
| `empleados` | `chunk-VSOPZPZB.js` | 53,28 kB | 14,29 kB |
| `proyectos` | `chunk-K5YLPUBE.js` | 2,02 kB | 1,02 kB |

  Además, el desglose por rol es un chunk propio (`chunk-TEPJGK3V.js`, 1,72 kB) que solo se descarga con `@defer`.
- **Las tres dependencias más pesadas** (bytes que aportan a la salida): `@angular/core` (131,07 kB), `@angular/router`
  (72,01 kB) y `@angular/forms` (38,80 kB). Les siguen `zone.js` (34,58 kB) y `@angular/common` (26,24 kB). Los
  únicos paquetes de `node_modules` en la salida son `@angular/*`, `rxjs`, `tslib` y `zone.js`, y ninguno aparece duplicado.

## ESLint

`ng lint` termina con **0 errores y 0 advertencias** (`All files pass linting`), también antes del laboratorio; no hizo
falta `--fix`. Resumen en [`lint-resumen.png`](../evidencias/lint-resumen.png). Nada que documentar ni plan de corrección.

## Lighthouse (antes / después)

Detalle en [`lighthouse-antes-despues.png`](../evidencias/lighthouse-antes-despues.png).

| Métrica | Antes | Después |
| --- | --- | --- |
| Performance | 100 | 99 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 82 | 82 |
| First Contentful Paint | 603 ms | 621 ms |
| Largest Contentful Paint | 673 ms | 808 ms |
| Total Blocking Time | 0 ms | 0 ms |
| Cumulative Layout Shift | 0 | 0 |

- **No hay mejora, y es lo esperable:** el «antes» era un marcador sin datos y el «después» muestra tres cifras reales (que
  piden `/users` y `/todos` al backend) y un hueco para el desglose, así que se miden dos páginas distintas; el LCP sube
  ~130 ms por esos datos y el resultado sigue siendo 99 de 100. Las mejoras del laboratorio (OnPush, `track`) ya estaban
  hechas en los laboratorios anteriores, y `@defer` no mejora una página tan pequeña.
- **SEO 82** (en ambos): Lighthouse suspende dos comprobaciones. Una es que falta una `<meta name="description">` en
  `index.html` (no es parte de este laboratorio y queda como mejora pendiente); la otra, `robots.txt`, es un efecto del
  servidor estático de la prueba, que devuelve `index.html` para cualquier ruta que no existe.
