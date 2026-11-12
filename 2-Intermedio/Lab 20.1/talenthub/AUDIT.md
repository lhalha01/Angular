# Auditoría de TalentHub — antes y después del refactor (Lab 20.1)

**Antes:** la base con deuda técnica, en [`../base/`](../base/README.md). **Después:** este proyecto (`talenthub/`), refactorizado.
Todas las cifras salen de ejecutar las herramientas de verdad sobre cada proyecto (no son estimaciones), con el mismo
procedimiento: `ng lint`, `npx tsc --noEmit --strict`, `ng test --code-coverage --watch=false`, `ng build --stats-json`,
`npm run check:architecture` y `npm run audit:debt` (el recuento estático de las deficiencias D-01 a D-08, nuevo en este lab).
Las capturas están en [`../evidencias/`](../evidencias/).

> **Cómo se obtuvo la base.** El enunciado habla de una base «proporcionada por el formador» que no existe en el repositorio, así
> que se construyó **reintroduciendo las ocho deficiencias** en una copia del TalentHub de la práctica final
> ([Lab 20](../../Lab%2020/talenthub/README.md)): `any` en los servicios (con el mapeo dentro de ellos, sin `mappers/` ni DTO),
> sin `OnPush`, `AuthGuard` como clase con `canActivate`, sin pruebas de `EmpleadoService` ni `ProyectoService`, las validaciones
> dentro del formulario, `*ngFor` sin `trackBy`, imports a archivos internos de otras features y `subscribe()` sin cancelar. La suite
> de la base pasa entera (232 pruebas), igual que la de un prototipo funcional. El proyecto refactorizado **coincide con el de
> la práctica final** (Lab 20) salvo las reglas de ESLint reforzadas y el script de auditoría, que se añaden aquí.

## Resumen

| Medida | Antes | Después |
| --- | --- | --- |
| Hallazgos de deuda (D-01 a D-08) | **82** | **0** |
| `ng lint`: errores | 42 (75 con la configuración reforzada) | **0** |
| `tsc --strict`: errores | 0 | 0 |
| `check:architecture`: infracciones | 24 | **0** |
| `ng test`: pruebas (todas pasan) | 232 | **322** |
| Cobertura de líneas (global) | 91,32 % | **100 %** |
| Cobertura de líneas: servicios de empleados | 78,87 % | **100 %** |
| Cobertura de líneas: servicios de proyectos | 25,00 % | **100 %** |
| Bundle inicial (`ng build`, sin comprimir) | 321,74 kB | **319,62 kB** |

## Fase 1 — Auditoría, herramienta por herramienta

### `ng lint` — 42 errores en 9 archivos

Métrica base: **42 errores** y 0 advertencias (33 `no-explicit-any`, 7 `no-restricted-imports`, 2 `prefer-inject`).
Las tres issues más graves:

1. **`any` en los servicios HTTP** (D-01): 15 en `EmpleadoService` y 14 en `ProyectoService`; las respuestas de la API se tratan
   sin tipo (`get<any>`, `(u: any) => …`, `catchError((error: any) => …)`), así que un cambio del formato de la API no lo detecta
   nadie hasta que falla en ejecución. Otros 4 en componentes que arrastran ese tipo (`dashboard`, `lista-proyectos`, `detalle-proyecto`).
2. **Imports a rutas internas de otras features** (D-07), 7: `dashboard`, `perfil`, `formulario-alta` y `desglose-por-rol` importan
   `@features/proyectos/services/…` o `@features/empleados/models/…` en lugar del barrel.
3. **`AuthGuard` con inyección por constructor** (`prefer-inject`, 2): el síntoma lint de D-03, el guard de clase.

Con la **configuración reforzada** de este lab (`prefer-on-push-component-change-detection` y `template/prefer-control-flow`), la
misma base da **75 errores**: los 42 anteriores más 17 componentes sin `OnPush` (D-02) y 16 usos de `*ngFor` / `*ngIf` (D-06); la
configuración original no los veía. Con ella, el proyecto refactorizado sigue en **0**.

### `ng test --code-coverage` — 232 pruebas, 91,32 % de líneas

Métrica base: **91,32 % de líneas** (91,24 % de sentencias, 84,21 % de funciones, 77,67 % de ramas), todas las pruebas en verde.
Las tres issues más graves (lo que la cifra global esconde):

1. **`ProyectoService` sin ninguna prueba** (D-04): 25,00 % de líneas y 0 % de ramas y de funciones en `features/proyectos/services/`.
2. **`EmpleadoService` sin pruebas propias** (D-04): la carpeta de servicios de empleados llega al 78,87 % de líneas solo gracias a las
   pruebas de la fachada y del estado (47,82 % de ramas): ni el mapeo, ni el 404, ni el alta, ni los reintentos tienen red de seguridad.
3. **Validaciones sin pruebas** (D-05): al estar dentro del componente, el validador de email único, el patrón del nombre y el
   validador cruzado solo se ejercitan a través del formulario entero; `shared/validators/` ni existe.

### `ng build --stats-json` — 321,74 kB iniciales

Métrica base: **321,74 kB** iniciales sin comprimir (92,8 kB de transferencia estimada por `ng build`; 103,34 kB con `gzip -9`) y
`main.js` de 3,93 kB. Chunks lazy: `empleados` 56,80 kB, `proyectos` 7,56 kB y `dashboard` 4,31 kB. Las tres dependencias más pesadas:
`@angular/core` (132,81 kB), `@angular/router` (72,00 kB) y `@angular/forms` (38,81 kB). Issues:

1. **El desglose por rol del dashboard va en su chunk, no diferido** (se pinta y descarga con la pantalla entera, aunque quede fuera de la vista).
2. **Los 11 `*ngFor` y 5 `*ngIf` arrastran `NgFor` y `NgIf`** a cada componente; el control de flujo nuevo se compila sin esas directivas.
3. **Todos los componentes en `Default`**: no afecta al tamaño, pero sí al coste en ejecución (D-02), que este informe no mide.

`webpack-bundle-analyzer` no sirve aquí: el builder `@angular/build` usa esbuild y su `--stats-json` es un metafile de esbuild, que
esa herramienta no lee. El análisis se hizo con ese metafile y con los archivos de `dist/` (script de la medición en el README).

### Arquitectura (`npm run check:architecture`) — 24 infracciones

17 componentes sin `OnPush` (regla `onpush`) y 7 imports que no pasan por el barrel (regla `barrel`: D-07).

## Estado de cada deficiencia

| # | Deficiencia | Antes | Después | Cómo se resolvió |
| --- | --- | --- | --- | --- |
| D-01 | `any` en los servicios | 33 | **0** | Tipos de dominio, DTO y funciones `*.mapper.ts` con type guards; `unknown` en la frontera de la API. `tsc --strict` sigue en 0 |
| D-02 | `ChangeDetection.Default` | 17 de 17 | **0** | `OnPush` en los 17 componentes + regla de ESLint que lo exige |
| D-03 | Guard como clase | 1 | **0** | `authGuard` funcional (`CanMatchFn`) con `inject()`; las rutas usan `canMatch` |
| D-04 | Sin tests en los servicios HTTP | 2 de 5 | **0** | Pruebas con `HttpTestingController` de `EmpleadoService` (mapeo, 404, búsqueda, reintentos, alta) y `ProyectoService` |
| D-05 | Validaciones inline | 5 | **0** | `shared/validators/` (email único, solo letras, sin espacios, proyecto obligatorio) con pruebas propias |
| D-06 | `*ngFor` sin `trackBy` | 11 | **0** | `@for … track` con el id del elemento (ids de empleado y de proyecto) y `@if` en lugar de `*ngIf`; regla `prefer-control-flow` |
| D-07 | Imports a archivos internos de otras features | 7 | **0** | Imports por el barrel de cada feature; la regla `features` fija el grafo permitido (`proyectos` ← `empleados` ← `dashboard`, sin ciclos) |
| D-08 | `subscribe()` sin cancelar | 6 componentes | **0** | `toSignal()` en 8 sitios, `takeUntilDestroyed()` en el envío del formulario, y se eliminaron los 2 `ngOnDestroy` |

Recuento de suscripciones en componentes: **8** `subscribe()` y **0** `toSignal()` antes → **1** `subscribe()` (con `takeUntilDestroyed`) y
**8** `toSignal()` después; `ngOnDestroy` en componentes: **2 → 0**.

## Hallazgos que el enunciado no listaba

- **El guard de clase con `canActivate` no protege lo que parece.** En la base, tras cerrar la sesión, navegar de `/empleados` a
  `/proyectos` **no vuelve a pasar por el guard** (Angular solo reevalúa `canActivate` del padre al activarlo, y el armazón ya está
  activo): la ruta queda abierta. La prueba «cerrar la sesión vuelve a proteger las rutas» falla con la base y hubo que retirarla de
  su suite; con `canMatch` pasa. Además, `state.url` pierde el destino escrito cuando hay redirecciones (`/no-existe` vuelve como
  `returnUrl=/dashboard`), y con `canActivate` el chunk de la ruta protegida se descarga antes de comprobar la sesión.
- **`@defer` no es gratis:** su runtime sube unos 8,6 kB el bundle inicial; ver abajo.

## Bundle: antes y después

| Medida | Antes | Después |
| --- | --- | --- |
| Initial total (`ng build`, sin comprimir) | 321,74 kB | **319,62 kB** (−2,12 kB) |
| Transferencia estimada por `ng build` | 92,80 kB | 93,61 kB (+0,81 kB) |
| Bytes iniciales con `gzip -9` | 103,34 kB | 104,07 kB (+0,73 kB) |
| `main.js` (sin comprimir) | 3,93 kB | 3,84 kB |
| Chunk lazy `dashboard` | 4,31 kB | 3,07 kB |
| Chunk lazy `empleados` | 56,80 kB | 56,95 kB |
| Chunk lazy `proyectos` | 7,56 kB | 7,28 kB |
| Chunk diferido del desglose (`@defer`) | no existe | 1,72 kB |

El criterio «el bundle no creció» se cumple en el tamaño sin comprimir (−2,1 kB: desaparecen `NgFor`, `NgIf` y el código de mapeo
con `any`) y **no del todo en lo que viaja por la red** (+0,8 kB): el runtime de `@defer` (unos 8,6 kB sin comprimir) compensa lo ganado y el
bloque diferido solo pesa 1,7 kB. Es el precio medido de una técnica que el enunciado pide aplicar (Fase 7) y que se justifica con
bloques mayores; ver `DECISION_LOG.md`.
