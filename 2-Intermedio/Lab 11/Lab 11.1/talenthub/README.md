# TalentHub: contratos de dominio (Lab 11.1)

Base de tipos del proyecto **TalentHub** (Angular 20, standalone, `strict: true`): modelos de dominio,
DTOs, mappers y type guards, sin `any`. Los siguientes laboratorios del nivel Intermedio se apoyan en ellos.

El enunciado está en [`../Lab 11.1.md`](../Lab%2011.1.md) (extraído de la primera mitad de `Lab 11.md`).

## Contexto: el briefing de TalentHub

El briefing completo está en el [Lab 20](../../../Lab%2020/Lab%2020.md): una herramienta interna de **Nexus Digital
Solutions** para gestionar el talento (hoy, en hojas de cálculo). Un portal donde cualquier manager vea el
**directorio de empleados**, filtre por habilidades y disponibilidad, **dé de alta** a nuevos empleados y vea los
**proyectos activos** y su equipo. Mientras no exista la API real, el backend temporal es JSONPlaceholder.

Este laboratorio pone la **base de tipos** sobre la que se construye el resto, y coincide con las entidades del
briefing:

| Briefing del Lab 20 | En este laboratorio |
| --- | --- |
| Entidades `Empleado`, `Habilidad`, `RolEmpleado`, `NuevoEmpleado`, `EmpleadoResumen`, `Proyecto`, `EstadoProyecto` | Idénticas (mismos campos y tipos) en `features/empleados/models/` y `features/proyectos/models/` |
| Patrón **Adapter**: `mapearEmpleado(dto)` adapta el DTO de JSONPlaceholder al dominio | `features/empleados/mappers/empleado.mapper.ts` |
| **RNF-06**: sin `any` en el código fuente | `no-explicit-any` como error en `eslint.config.js` |
| **RNF-03**: `ng lint` a 0 errores | `npm run lint` |
| Arquitectura por features, sin imports cruzados | Modelos y mappers dentro de su feature |

Lo que este laboratorio añade y el briefing no muestra: `ActualizarEmpleado` y `ProyectoResumen` (los pide el
enunciado del 11.1) y la regla que impide importar un DTO fuera de un mapper. Quedan para los laboratorios
siguientes los servicios, los componentes, los barrel files (`index.ts` por feature, RNF-07), los interceptores y
el resto de requisitos del briefing.

## Instalación y ejecución

El proyecto forma parte del workspace del nivel Intermedio (`2-Intermedio`), que comparte un único `node_modules`
entre los Labs 11 a 19:

```bash
cd 2-Intermedio
npm install               # una sola vez para todo el nivel (o npm ci, para instalar exactamente lo fijado)

cd "Lab 11/Lab 11.1/talenthub"
npm start                 # http://localhost:4200/
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                  # tipos, sin errores
npm run lint                                               # 0 errores, incluido no-explicit-any
npx ng test --watch=false --browsers=ChromeHeadless        # 17 tests (necesitan Chrome o Chromium)
```

## Estructura

```text
src/app/features/
├── empleados/
│   ├── models/empleado.model.ts      Empleado, Habilidad, RolEmpleado, NuevoEmpleado,
│   │                                 ActualizarEmpleado, EmpleadoResumen y el guard esEmpleado
│   └── mappers/
│       ├── empleado.dto.ts           EmpleadoDto: formato de /users de JSONPlaceholder
│       └── empleado.mapper.ts        mapearEmpleado(dto) → Empleado
└── proyectos/
    └── models/proyecto.model.ts      Proyecto, EstadoProyecto, ProyectoResumen
```

## Decisiones de diseño

- **Utility Types.** `NuevoEmpleado`, `ActualizarEmpleado`, `EmpleadoResumen` y `ProyectoResumen` se derivan de
  `Empleado` y `Proyecto` con `Omit`, `Pick` y `Partial`, de modo que no hay que mantener campos duplicados.
- **Los DTOs no salen de los mappers.** Una regla `no-restricted-imports` en `eslint.config.js` prohíbe importar
  cualquier `*.dto` desde un archivo que no sea `*.mapper.ts` (o su test). Se comprobó con un archivo de prueba
  que `ng lint` la detecta. El resto de la aplicación solo conoce el modelo de dominio.
- **Sin `any`.** `@typescript-eslint/no-explicit-any` está activado como error, lo que también cubre `as any`.
- **`ng lint` configurado a mano.** Un proyecto nuevo no trae linter; se añadió `angular-eslint` (versión 20, la de
  Angular 20) con su `eslint.config.js`, el objetivo `lint` en `angular.json` y el script `npm run lint`.
- **Type guard superficial.** `esEmpleado` comprueba que el valor sea un objeto con `nombre`, `email` y `rol`,
  como pide el enunciado; no valida los tipos de los campos ni el resto de propiedades. Para datos de una API
  real convendría una validación completa (por ejemplo, con un esquema).
- **Valores simulados en el mapper.** `rol` (`desarrollador`), `disponible` (id par) y `fechaIncorporacion`
  (fecha del mapeo) son provisionales hasta disponer de la API real, como indica el enunciado.
- **Contratos de tipos como tests.** `empleado.model.spec.ts` usa `@ts-expect-error` para comprobar que los
  tipos rechazan lo que deben (por ejemplo, un `id` en `NuevoEmpleado`): si alguien los relaja, el test deja de
  compilar.

## Integridad de paquetes y vulnerabilidades (2026-11-11)

Comprobado desde `2-Intermedio` (workspace compartido por los Labs 11 a 19):

- **Integridad:** `npm audit signatures` → los 704 paquetes con firma de registro verificada. Las 791 entradas
  del `package-lock.json` llevan hash de integridad y ninguna procede de un origen distinto del registro de npm.
- **`npm audit --omit=dev` (lo que llega al navegador): 0 vulnerabilidades.**
- **`npm audit` completo: 27, todas de gravedad moderada** (0 altas, 0 críticas), todas en herramientas de
  desarrollo: avisos de `glob` y `minimatch` dentro de `@angular/cli`, `angular-eslint` y `typescript-eslint`.
  `npm audit fix --force` propone **bajar de versión** (`@angular/cli@17`, `angular-eslint@18`), incompatible con
  Angular 20, así que no se aplica: se documenta.
- **Versiones:** Angular 20.3 (CLI 20.3), TypeScript 5.9 y `angular-eslint` 20.7, la línea que fija el curso
  (`Node < 22`). Angular 21 es estable y admite Node 20.19; Angular 22 exige Node 22.22 o superior.

## Notas del enunciado

El enunciado pide entregar en la rama `lab-11-typescript` y una captura de `npx tsc --noEmit` sin errores. En este
repositorio el trabajo se sube a `main`. La captura está en [`../evidencias/`](../evidencias/):

- [`tsc-noemit.png`](../evidencias/tsc-noemit.png): imagen con los comandos `npx tsc --noEmit` y
  `npx tsc --noEmit --strict` y su código de salida (0 en ambos).
- [`tsc-noemit.txt`](../evidencias/tsc-noemit.txt): el mismo registro en texto, con la fecha y las versiones.

`tsc` no imprime nada cuando todo es correcto, por eso la captura muestra el código de salida. La imagen se
generó a partir de la salida real de los comandos (no es una fotografía de una ventana de terminal).
