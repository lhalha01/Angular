# TalentHub — Lab 20 (práctica final del nivel Intermedio)

Portal interno de **Nexus Digital Solutions** para gestionar el talento: directorio de empleados con búsqueda y filtros,
perfil con habilidades y proyecto, alta de empleados con formulario reactivo, proyectos con su equipo y un dashboard con
cifras. Angular 20 (standalone, Signals, `strict: true`).

El enunciado está en [`../Lab 20.md`](../Lab%2020.md). **Este proyecto es independiente**: tiene su propio `package.json`,
su propio `package-lock.json` y su propio `node_modules` (no comparte dependencias con el workspace del nivel).

## Cómo arrancar

Requisitos: **Node.js ≥ 20.19 y < 22**, npm y, para el backend, Python 3.11 o superior.

TalentHub usa **siempre las APIs locales** del repositorio (`backend/`: FastAPI + SQLite, recursos `/users` y `/projects`) en lugar de
JSONPlaceholder, así que hay que arrancar primero el backend:

```bash
# 1. Backend (desde la carpeta backend/ del repositorio)
.\start.cmd               # Windows;  en Linux/macOS: ./start.sh      → http://localhost:8000

# 2. Aplicación (desde esta carpeta)
npm install               # una sola vez; instala en el node_modules de este proyecto
npm start                 # http://localhost:4200/
```

**Credenciales del login simulado:** cualquier email y cualquier contraseña (por ejemplo, `ana@example.com` / `1234`). No
hay comprobación real: se guarda un token opaco en `sessionStorage` (se pierde al cerrar la pestaña) y se redirige al
dashboard. Sin token, cualquier ruta redirige a `/login` (RF-06).

## Cómo ejecutar las comprobaciones

```bash
npm test                                                             # Karma en modo interactivo (escucha cambios)
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage  # una sola pasada, con cobertura (no necesita el backend)
npm run lint                                                         # ESLint: 0 errores y 0 advertencias
npx tsc --noEmit --strict                                            # tipos
npm run check:architecture                                           # barrel, capas, dependencias entre features y OnPush
npm run test:architecture                                            # 16 pruebas de esa comprobación
npm run build                                                        # build de producción (sin avisos de tamaño)
```

Resultados actuales: **322 tests** pasando, cobertura del 100 % de líneas (98,33 % de ramas) y del 100 % en los servicios
de `empleados` (RNF-05 pide > 70 %); `ng lint` sin errores ni advertencias; build con **319,62 kB** iniciales
(93,61 kB transferidos), muy por debajo del aviso de 500 kB (RNF-04); `npm audit --omit=dev`: 0 vulnerabilidades.

## Estructura

```text
src/app/
├── core/          guards (auth, cambios pendientes), interceptores (auth, errores), layout (navbar, footer, shell,
│                  notificaciones), login, AuthService y NotificacionService
├── shared/        components (spinner, avatar, badge-disponibilidad), validators (email-unico, no-espacios, solo-letras,
│                  proyecto-obligatorio)
└── features/
    ├── empleados/ models, mappers (DTO ↔ dominio), services (empleado, empleado-state, empleados.facade), filtros
    │              (estrategias), resolvers, components (directorio, perfil, formulario-alta) y barrel (index.ts)
    ├── proyectos/ models, mappers, services (proyecto), resolvers, components (lista-proyectos, detalle-proyecto), index.ts
    └── dashboard/ components (dashboard, stat-card, desglose-por-rol) e index.ts
```

Reglas de arquitectura (las comprueba `npm run check:architecture`): una feature solo se importa **por su barrel**; `core/` y
`shared/` no dependen de `features/`; y las dependencias entre features son un grafo **sin ciclos**: `proyectos` no depende
de nadie, `empleados` usa a `proyectos` y `dashboard` compone a las dos. El patrón de cada decisión está en
[`DECISION_LOG.md`](./DECISION_LOG.md).

## Requisitos funcionales y no funcionales

| Requisito | Dónde está |
| --- | --- |
| **RF-01** Directorio: nombre, email, rol y badge; búsqueda (debounce 300 ms, mín. 2 caracteres); filtros por disponibilidad y rol combinados | `DirectorioEmpleados`, `EmpleadosFacade`, `filtros/` — [`directorio-filtros.png`](../evidencias/directorio-filtros.png) |
| **RF-02** Detalle por resolver, habilidades con nivel coloreado y nombre del proyecto | `PerfilEmpleado`, `empleadoResolver` — [`perfil-empleado.png`](../evidencias/perfil-empleado.png) |
| **RF-03** Alta con `FormArray`, validadores síncronos y asíncrono, validación cruzada y `CanDeactivate` | `FormularioAlta`, `cambiosPendientesGuard` — [`formulario-errores.png`](../evidencias/formulario-errores.png); el alta se guarda entera y sobrevive a recargar: [`alta-persistente.png`](../evidencias/alta-persistente.png) |
| **RF-04** Proyectos con cliente, estado, nº de empleados y filtro por estado; detalle con el equipo | `ListaProyectos`, `DetalleProyecto`, `proyectoResolver` — [`proyectos-filtro.png`](../evidencias/proyectos-filtro.png), [`detalle-proyecto.png`](../evidencias/detalle-proyecto.png) |
| **RF-05** Dashboard protegido con las tres cifras y el bloque detallado con `@defer (on viewport)` | `Dashboard`, `StatCard`, `DesglosePorRol` — [`dashboard.png`](../evidencias/dashboard.png) |
| **RF-06** Autenticación simulada | `Login`, `AuthService`, `authGuard` (`canMatch`) |
| **RNF-01** `OnPush` en todos los componentes | Los 17 componentes; lo comprueba la regla `onpush` |
| **RNF-02** `track` en todos los `@for` | Los 12 `@for` (ids de empleado y de proyecto; el rol, el nivel o el control en las listas fijas) |
| **RNF-03** `ng lint` a 0 errores | 0 errores y 0 advertencias |
| **RNF-04** Sin avisos de bundle > 500 kB | 319,62 kB iniciales; el directorio, el dashboard y los proyectos son chunks lazy |
| **RNF-05** > 70 % en los servicios de `empleados` | 100 % — [`cobertura-karma.png`](../evidencias/cobertura-karma.png) |
| **RNF-06** Sin `any` | `@typescript-eslint/no-explicit-any` como error |
| **RNF-07** Barrels e imports por el barrel | Regla `barrel` de `check:architecture` |

Pruebas que pide el enunciado: `EmpleadoService` (GET, mapeo del DTO, 404 y mucho más), `authGuard` (autenticado y no
autenticado), `emailUnicoValidator` (duplicado y único) y `DirectorioEmpleados` (lista, spinner, búsqueda): todas están, con
la fachada simulada y con la real.

## Los datos: el backend adaptado

El backend del repositorio se adaptó para esta práctica (esquema v5, con permiso del curso: antes de añadir recursos o campos
se pregunta) y **ya guarda todo lo que TalentHub necesita**, así que la aplicación no simula nada de los datos:

- **`/users` son los empleados.** Además de nombre y email, cada usuario tiene `role`, `skills` (habilidades con nivel),
  `available`, `projectId` y `hiredAt`. Son opcionales y con valor por defecto, de modo que el Lab 10 y el 10.1 del nivel Básico
  siguen funcionando igual. El backend impone la misma regla del formulario: quien no está disponible debe tener un proyecto
  (y el proyecto debe existir). Filtros: `role`, `available`, `projectId` (el equipo de un proyecto) y la búsqueda `q`.
- **`/projects` son los proyectos:** `name`, `client`, `status` (`active`, `paused`, `completed`), fechas y `memberIds`, el equipo,
  que son los usuarios cuyo `projectId` apunta a él. Al borrar un proyecto, su equipo queda sin proyecto y disponible.
- **Los 10 usuarios y los 20 proyectos de ejemplo** vienen en la base de datos del repositorio (`backend/data/app.db`,
  migrada al esquema 5) y en `backend/app/seed/`.
- **El alta es real:** `POST /users` guarda nombre, email, rol, habilidades, disponibilidad y proyecto; la persona sale igual
  tras recargar la página ([`alta-persistente.png`](../evidencias/alta-persistente.png)).
- **El validador de email único sigue siendo simulado**, como pide el enunciado: es duplicado cualquier email que contenga «test».

Los mappers son los que traducen entre la API (en inglés: `name`, `role`, `status: 'paused'`…) y el dominio de TalentHub (en
español: `nombre`, `rol`, `estado: 'pausado'`…): patrón Adapter. Los tests de la aplicación simulan HTTP, así que no necesitan el
backend; los del backend (232) están en `backend/tests/`.

## Desviaciones respecto al enunciado

1. **API:** se usa el backend local (decisión del curso para el nivel Intermedio), adaptado con `/projects` y los datos de
   empleado en `/users`, y no JSONPlaceholder; `EmpleadoService` y `ProyectoService` siguen siendo los únicos que conocen el
   origen (patrón Repository).
2. **Plantillas en línea** en el `.ts` de cada componente, en lugar de un `.html` aparte; los nombres de los componentes de
   perfil y de la lista siguen la convención `perfil` y `directorio` de los laboratorios anteriores (`perfil-empleado` del
   árbol del enunciado es `PerfilEmpleado`, en `components/perfil/`).
3. **`canMatch` en el guard de autenticación** (en lugar de `canActivate`): la ruta protegida ni siquiera descarga su chunk
   sin sesión.
4. **`provideHttpClientTesting()`** en las pruebas, en lugar del `HttpClientTestingModule` del enunciado, obsoleto.
5. **Las capturas** salen de la base de datos de ejemplo (`backend/data/app.db`); el recorrido se hizo con una copia temporal de
   la base, así que no se modificó (el alta de «Marta Ruiz» solo existe en esa copia).
6. **Las capturas no son de DevTools:** son capturas reales de un recorrido automatizado con Chrome sobre el build de
   producción; la de cobertura combina la salida real de `ng test --code-coverage` con una tabla sacada del informe generado.

## Evidencias

En [`../evidencias/`](../evidencias/): directorio con filtros activos, formulario con errores de validación, resumen de
cobertura de Karma (`cobertura-karma.png` y `cobertura.txt`), perfil, alta guardada tras recargar, proyectos, detalle de proyecto
y dashboard.

## Versiones y seguridad

Angular **20.3.35** (CLI 20.3.42), TypeScript 5.9, RxJS 7.8 y Zone.js 0.15: la última versión de la rama 20, la que fija el
curso (Node < 22). `npm audit --omit=dev` (lo que llega al navegador): **0 vulnerabilidades**. El `npm audit` completo
muestra 27 de gravedad moderada, todas en herramientas de desarrollo (`@angular/cli` y sus dependencias); no se aplica
`npm audit fix --force`, porque propone versiones incompatibles con Angular 20.

## Entrega

El enunciado pide la rama `lab-20-talenthub`. En este repositorio el trabajo se sube a `main`.
