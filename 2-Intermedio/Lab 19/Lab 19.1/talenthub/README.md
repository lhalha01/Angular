# TalentHub: performance y calidad (Lab 19.1)

**TalentHub** (Angular 20, standalone, `strict: true`) con un dashboard real (tres cifras y el desglose por rol diferido con
`@defer`), todos los componentes en `OnPush`, `track` en todos los bucles y el análisis del bundle, de ESLint y de Lighthouse
documentado en [`AUDIT.md`](./AUDIT.md). Parte del [Lab 18.1](../../../Lab%2018/Lab%2018.1/talenthub/README.md).

El enunciado está en [`../Lab 19.1.md`](../Lab%2019.1.md) (extraído de la primera mitad de `Lab 19.md`) y el briefing
completo del proyecto, en el [Lab 20](../../Lab%2020/Lab%2020.md).

## Instalación y ejecución

El proyecto forma parte del workspace del nivel Intermedio (`2-Intermedio`), que comparte un único `node_modules`.
**TalentHub usa siempre el backend local** (`/users` y `/todos`), así que hay que arrancarlo antes:

```bash
# 1. backend (desde la carpeta backend/ del repositorio; necesita Python 3.11 o superior)
.\start.cmd               # Windows;  en Linux/macOS: ./start.sh

# 2. aplicación
cd 2-Intermedio
npm install               # una sola vez para todo el nivel (o npm ci)
cd "Lab 19/Lab 19.1/talenthub"
npm start                 # http://localhost:4200/  (cualquier email y contraseña sirven en el login)
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                            # tipos
npm run lint                                                         # ESLint: 0 errores y 0 advertencias
npm run check:architecture                                           # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                            # tests de esa comprobación (13)
npx ng build --stats-json                                            # compilación + metafile para analizar el bundle
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage  # 271 tests, 100 % de líneas (no necesitan el backend)
```

## Qué hay de nuevo respecto al Lab 18.1

```text
src/app/features/dashboard/components/
├── dashboard/           las tres cifras (StatCard) y el desglose diferido con @defer
├── stat-card/           StatCard: un título y una cifra («—» mientras no se conoce)
└── desglose-por-rol/    DesglosePorRol: empleados por rol, con barras proporcionales
```

El dashboard era un marcador («aquí se mostrarán…»); el enunciado supone que ya tiene estadísticas y un desglose, así que
se han creado. Las cifras de empleados salen del estado de `EmpleadosFacade` (la misma lista que el directorio; si ya estaba
cargada no se vuelve a pedir) y los proyectos activos, de `ProyectoService`.

| Criterio del enunciado | Cómo se cumple |
| --- | --- |
| `OnPush` en el 100 % de los componentes | Los 13 componentes lo llevan; `npm run check:architecture` (regla `onpush`) lo comprueba y falla si falta en alguno |
| Todos los `@for` tienen `track` con id único | Los 9 `@for` llevan `track` (ids de empleado y de proyecto, el rol o el nivel en las listas fijas, el control en el `FormArray`); Angular ya exige un `track` en cada `@for` |
| El desglose por rol se carga con `@defer` | `@defer (on viewport; prefetch on idle)` con `@loading` y `@placeholder`; chunk propio de 1,72 kB; pruebas con `DeferBlockBehavior.Manual` en `dashboard.spec.ts` |
| `ng lint` a 0 errores | 0 errores y 0 advertencias, sin necesidad de `--fix` |
| `ng test` sigue pasando | 271 tests (245 en el 18.1 + 15 del dashboard, `StatCard` y `DesglosePorRol` + 11 de la capa de datos adaptada), 100 % de líneas |
| Chunks separados para `empleados`, `proyectos` y `dashboard` | Uno por feature (`empleados` 53,28 kB, `dashboard` 3,06 kB, `proyectos` 2,02 kB); detalle en `AUDIT.md` |

## Desviaciones respecto al enunciado

1. **No existe `app-empleado-card`**: el directorio dibuja cada empleado como un enlace al perfil (no hay tarjeta ni botón
   «eliminar» en la interfaz), así que no se añade un `(eliminar)` que no existe. El bucle ya llevaba `track empleado.id`.
2. **Las plantillas están en línea** (en el `.ts` del componente), como en el resto del proyecto, no en
   `dashboard.component.html`.
3. **`webpack-bundle-analyzer` no sirve con este builder**: `@angular/build` usa esbuild y su `--stats-json` es un metafile de
   esbuild. El análisis se hizo con ese metafile y con los archivos de `dist/` (tamaños, chunks por feature y dependencias).
4. **`@defer` añade ~8,6 kB al bundle inicial** (el runtime de `@defer` entra en cuanto se usa): para un bloque de 1,72 kB no
   compensa en tamaño, pero es lo que pide el enunciado. Se explica en `AUDIT.md`.
5. **El Lighthouse «antes/después» no mejora** (100 → 99 de rendimiento): el «antes» era un marcador y el «después» tiene
   datos reales, y las optimizaciones de OnPush y `track` ya estaban hechas. Se documentan los números reales.
6. **Lighthouse se ejecutó con el paquete `lighthouse` (v12) en modo escritorio**, contra un servidor estático del build de
   producción y el backend local con una base de datos temporal (`BACKEND_DB`); no son capturas de la pestaña de Chrome.
7. **Cifras del dashboard:** `—` mientras no hay datos o si la carga falla (el aviso del error lo da el interceptor); una
   recarga conserva la lista anterior.

## Adaptación al backend con empleados y proyectos reales

Esta es la **versión final de la serie** 11.1–19.1 (cada laboratorio es una copia del anterior). Cuando el backend se adaptó
para la práctica final ([Lab 20](../../../Lab%2020/talenthub/README.md)), esta versión adoptó también la **capa de datos**:
`EmpleadoService` lee y guarda los empleados de `/users` con su rol, habilidades, disponibilidad y proyecto (`role`, `skills`,
`available`, `projectId`, `hiredAt`) y `ProyectoService` lee los proyectos de `/projects` (ya no son tareas disfrazadas); los
mappers (`empleado.mapper.ts`, `proyecto.mapper.ts`) traducen la API al dominio. El código de la interfaz de este laboratorio no
cambia, y los laboratorios 11.1 a 18.1 se quedan como estaban (siguen funcionando: los cambios del backend son aditivos).
Con ello, las pruebas pasan a ser 271. Los tamaños del bundle de `AUDIT.md` no cambian (306,95 kB iniciales antes y después).

## Evidencias

En [`../evidencias/`](../evidencias/): [`bundle-analisis.png`](../evidencias/bundle-analisis.png) (tamaños, chunks por
feature y dependencias más pesadas, antes y después), [`lint-resumen.png`](../evidencias/lint-resumen.png) (salida real de
`ng lint`) y [`lighthouse-antes-despues.png`](../evidencias/lighthouse-antes-despues.png); `evidencias.txt` las resume.

## Notas del enunciado

El enunciado pide entregar en la rama `lab-19-performance`. En este repositorio el trabajo se sube a `main`.
