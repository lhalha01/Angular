# Gestor de Tareas (Angular 20)

SPA para gestionar tareas: listar, filtrar, ver detalle, crear, editar y eliminar. En el nivel Intermedio **usa siempre
el backend propio** de la carpeta `backend/` del repositorio (APIs locales `/todos` y `/users`, FastAPI + SQLite), que
guarda los cambios. La API pública ([JSONPlaceholder](https://jsonplaceholder.typicode.com), sin persistencia: el estado
vive solo en memoria) queda como opción explícita (`npm run start:public`) y es la que usan los tests.

## Requisitos

- Node.js **≥ 20.19 y < 22** (Angular 20 exige 20.19 o superior; el curso exige menos de 22)
- npm

## Instalación y ejecución

Esta es la **copia de trabajo del Lab 10 para el nivel Intermedio**: parte del proyecto de `1-Basico/Lab 10/lab-10-app`
(que se mantiene tal como se entregó) y se modifica aquí para poder hacer los Labs 11 a 19. Forma parte del workspace
de `2-Intermedio`: **comparte el `node_modules` con los demás Labs del nivel** y no tiene `package-lock.json` propio
(el del workspace está en `2-Intermedio/`).

```bash
# 1. backend (desde la carpeta backend/ del repositorio; necesita Python 3.11 o superior)
.start.cmd              # Windows;  en Linux/macOS: ./start.sh

# 2. aplicación
cd 2-Intermedio
npm install                      # una sola vez para todo el nivel
cd "Lab 10/tareas"
npm start                        # http://localhost:4200/, hablando con http://localhost:8000
```

Para instalar de forma reproducible y verificando los hashes del lockfile se puede usar `npm ci`.

Otros comandos: `npm run build` (producción, también contra el backend local), `npm run lint`, `npm test` (Karma +
Jasmine; en CI: `npx ng test --watch=false --browsers=ChromeHeadless`; no necesita el backend) y
`npm run start:public` (API pública, sin persistencia).

### Configuraciones de la API

| Comando | API | Persistencia |
| --- | --- | --- |
| `npm start`, `npm run build` | Backend propio (`http://localhost:8000`, `environment.local.ts`) | Sí (SQLite) |
| `npm run start:public` | JSONPlaceholder (`environment.ts`) | No: los cambios se pierden al recargar |
| `npm test` | Sin red: peticiones simuladas (por defecto, modo de la API pública) | — |

Sin el backend arrancado, `npm start` muestra el error de carga de la lista (con "Reintentar") y, al guardar, un aviso
que sugiere comprobar que el backend está arrancado.

## Rutas

| Ruta | Componente |
| --- | --- |
| `/login` | `Login` (única pantalla pública: sirve cualquier email y contraseña) |
| `/` | `HomeComponent` |
| `/tasks` | `TaskListComponent` (búsqueda, filtros, orden y paginación; borrado con diálogo de confirmación) |
| `/tasks/:id` | `TaskDetailComponent` |
| `/tasks/:id/edit` | `TaskEditComponent` (ruta hija de `:id`) |
| `/add-task` | `AddTaskComponent` |

**Todo salvo `/login` exige sesión**: `authGuard` (`canMatch`) redirige a `/login?returnUrl=<destino>` y los chunks protegidos ni se descargan. Cada pantalla es un chunk propio (`loadComponent`); la feature `tareas` aporta sus rutas con `loadChildren`
(`tareas.routes.ts`) y `home` se carga por su barrel. El `:id` llega como `input()` (`withComponentInputBinding`).
`/add-task` y `/tasks/:id/edit` llevan un guard `canDeactivate` (`unsavedChangesGuard`): si hay cambios sin guardar,
antes de salir (enlace, Cancelar o botón atrás) se pide confirmación; cerrar o recargar la pestaña usa el aviso
nativo del navegador.

## Funcionalidades de la lista (`/tasks`)

- **Búsqueda** por título (sin distinguir mayúsculas ni tildes) y filtros por **estado** y **usuario**.
- **Ordenación**: recientes, antiguas, título A–Z / Z–A, pendientes o completadas primero.
- **Paginación** con selector "Por página": 10, 25, 50, 100 o Todos.
- **Vista** en marcos (tarjetas) o en lista; se recuerda la elección.
- **Filtros en la URL** (`/tasks?estado=pending&usuario=3&orden=title-asc`): se conservan al recargar o compartir el enlace.
- **Cambio de estado** pulsando la etiqueta, con confirmación; **borrado** con confirmación y opción de **Deshacer**.
- **Avisos** al crear, editar, cambiar estado, borrar y restaurar.
- **Tema claro/oscuro** desde la barra superior (se recuerda; por defecto, el del sistema).
- Contador de resultados, "Limpiar filtros" y estados vacíos con acción.

## Estructura y decisiones de diseño

```text
src/app
├── core/                       infraestructura sin lógica de negocio; no depende de features
│   ├── guards/                 auth.guard (canMatch: sin sesión → /login?returnUrl=…), unsaved-changes.guard (canDeactivate)
│   ├── login/                  pantalla de acceso (simulada; token opaco en sessionStorage)
│   ├── interceptors/           (vacía: la rellena el Lab 14)
│   ├── layout/navbar/          cabecera: marca, título del nivel y tema; con sesión, enlaces y «Cerrar sesión»
│   ├── services/               auth (sesión simulada), in-memory-resource (base común del estado en memoria), ignore-server-outcome,
│   │                           storage (localStorage que nunca lanza), theme, toast, confirm
│   └── api-error.ts            describeApiError: texto para el usuario cuando la API falla
├── shared/                     piezas reutilizables sin lógica de negocio; no depende de features
│   ├── components/             paginator (+ paginate(), lógica pura), state-message, confirm-dialog (<dialog>), toast
│   ├── directives/             appHighlightUser
│   └── pipes/                  taskStatus
├── features/                   cada feature se importa solo por su barrel (`@features/<feature>`)
│   ├── home/                   index.ts
│   ├── tareas/                 index.ts + tareas.routes.ts (rutas /tasks y /add-task, cargadas con loadChildren)
│   │   ├── models/             task.model.ts (Task, NewTask…, isTask)
│   │   ├── services/           task.service.ts, task-actions.service.ts (confirmar + modificar + avisar + Deshacer)
│   │   ├── components/         task-list (pantalla; task-query.ts y task-list-params.ts son funciones puras),
│   │   │                       task-card, task-toolbar, task-form, task-detail, task-edit, add-task
│   │   └── task.resolver.ts    carga la tarea de `:id` antes de activar la ruta
│   └── usuarios/               index.ts
│       ├── models/             user.model.ts (User, UserDraft, isUser)
│       ├── services/           user.service.ts
│       └── components/         (vacía)
└── environments/ (fuera de src/app)   URL de la API y modo (`persistentApi`) según la configuración de compilación
```

Alias de rutas (`tsconfig.json`): `@core/*`, `@shared/*` y `@features/*`. La arquitectura se vigila con la regla
`no-restricted-imports` de ESLint (sin rutas internas de otra feature) y con `npm run check:architecture`
(barrels, capas, dependencias entre features y `OnPush`), que tiene sus propios tests (`npm run test:architecture`).

- **La lista solo orquesta** (≈190 líneas): guarda el estado de la consulta, lo sincroniza con la URL y delega.
  La lógica está en funciones puras con tests propios; la presentación, en componentes pequeños.
- **Resolver**: `tasks/:id` resuelve la tarea una vez y las rutas hijas (detalle y edición) la reciben como
  `input()`. `runGuardsAndResolvers: 'always'` la recarga tras editar, para no mostrar datos antiguos.
- **Estado en memoria sin duplicar**: `TaskService` y `UserService` extienden `InMemoryResource` (carga, signal,
  búsqueda por id, añadir/actualizar/borrar/restaurar) y solo aportan su vocabulario y sus reglas.
- **API simulada**: las escrituras (POST/PUT/DELETE) se envían, pero `ignoreServerOutcome` hace explícito, en un único
  sitio, que ni su respuesta ni su error cambian el resultado. Con una API real habría que quitarlo para que los
  errores llegaran al usuario. Los errores de la carga inicial sí se muestran (con "Reintentar").
- **Dos modos de API (`environment.persistentApi`)**, resueltos solo en `InMemoryResource` para que el resto de la
  aplicación no se entere. Con el backend propio (configuración `local`): el id y la fecha de creación los asigna el
  servidor (no se envía el id del cliente) y se guarda lo que responde; **los errores de la API dejan de ignorarse** y
  llegan al usuario con `describeApiError` (por ejemplo, "no se pudo conectar con el servidor. ¿Está arrancado el
  backend?"); y **"Deshacer"** recrea la tarea en el servidor con su mismo id y su fecha (`POST` con `id`), y avisa
  si el servidor responde 409 porque el id está ocupado. Por eso `restoreTask` devuelve un `Observable<boolean>` en
  lugar de un booleano. La API pública sigue funcionando exactamente como antes.
- **Borrar usuarios con el backend propio** borra también sus tareas allí (borrado en cascada). La aplicación no
  ofrece borrar usuarios, así que no se ve afectada; si se añadiera, habría que recargar las tareas después.
- **Ciclo de vida**: `TaskFormComponent.ngOnChanges` reinicia el formulario con una copia cada vez que el padre pasa
  un valor inicial; `TaskListComponent.ngOnInit` lee los filtros de la URL; `ToastService.ngOnDestroy` cancela los
  temporizadores pendientes. El resto del estado reactivo usa signals y `effect()`, que se limpian solos.
- **Pruebas**: `npm test` ejecuta 252 tests (cobertura ≈99 % de líneas: 99,49 %), incluida una prueba de integración
  de las rutas reales. 40 de ellos cubren el modo del backend propio: ids y fechas del servidor, errores que
  llegan al usuario, "Deshacer" contra la API (incluido el 409) y los formularios de crear y editar.
- **UserService** (servicio mock de `Servicios_mock.md`): listar, obtener por id, crear (POST) y eliminar (DELETE)
  usuarios en JSONPlaceholder, con estado en memoria. Se usa para cruzar tarea → nombre de usuario.
- **Directiva** `appHighlightUser`: resalta nombres que empiezan por vocal (admite tildes).
- **Pipe** `taskStatus`: `Completada ✅` / `Pendiente ⏳`; además se usan `uppercase` y `date` (locale `es`).
- **ConfirmService / ToastService**: diálogo modal (`<dialog>`) y avisos propios, en lugar de `window.confirm`.
- **Formulario**: template-driven con `[(ngModel)]` y validaciones (título obligatorio, 3–120 caracteres y
  no en blanco; usuario obligatorio elegido de la lista).

## Versiones y seguridad de dependencias

- **Versiones**: Angular **20.3.35** (CLI 20.3.42), TypeScript 5.9, `zone.js` 0.15 y `rxjs` 7.8. Es la última versión
  de la rama 20, la que fija el curso (`Lab 01`: Angular 20, Node < 22). `package.json` declara `engines.node` en
  `>=20.19.0 <22.0.0`. Angular 21 es estable y también admite Node 20.19, por lo que sería la siguiente
  migración posible; Angular 22 exige Node ≥ 22.22 y no es compatible con el requisito del curso.
- **Integridad**: `npm audit signatures` → los 941 paquetes tienen firma de registro verificada (248 con
  atestaciones). Las 1028 entradas del lockfile llevan hash de integridad y ninguna procede de un origen
  distinto del registro de npm.
- **`npm audit --omit=dev` (lo que llega al navegador): 0 vulnerabilidades.**
- **`npm audit` completo: 21, todas de gravedad moderada** (ninguna alta ni crítica) y todas en herramientas de
  desarrollo: `@angular-devkit/build-angular`, `@angular/cli` y sus dependencias (`webpack-dev-server`, `sockjs`,
  `sigstore`, `pacote`, `minimatch`, `uuid`…). No se incluyen en el bundle de producción; solo afectan a quien
  ejecuta el servidor de desarrollo o la compilación.
- **No se aplica `npm audit fix --force`**: propone instalar `@angular/cli@17.3.17` (**una versión anterior**) y
  `@angular-devkit/build-angular@22`, incompatibles entre sí y con Angular 20. Se documenta en lugar de aplicarlo.
- Historial: en Angular 19 había 43 vulnerabilidades (2 críticas, 14 altas) y 7 en runtime; la subida a la rama 20
  las eliminó en runtime y dejó solo las 21 moderadas de herramientas.

## Cambios respecto al Lab 10 del nivel Básico

| Cambio | Lab |
| --- | --- |
| Builders de `@angular-devkit/build-angular` (webpack) a `@angular/build`, para compartir dependencias con el nivel; paquete `tareas-lab-11` | — |
| Título «Angular nivel intermedio» en la cabecera, para distinguirla de la del Básico | — |
| `npm start` y `ng build` usan el backend local por defecto; la API pública pasa a `npm run start:public` (se sustituye `start:local`) | — |
| ESLint (`npm run lint`) con la configuración del Lab 11.1: **0 errores**, `no-explicit-any` como error | 11.2 |
| `confirm-dialog`: el clic sobre el fondo ya no usa `(click)` en la plantilla (2 errores de accesibilidad); el equivalente de teclado es Escape | 11.2 |
| Las 4 llamadas `HttpClient` que no llevaban tipo (`post`, `put`, `delete` de `InMemoryResource`) ahora lo llevan | 11.2 |
| Modelos movidos a `src/app/models/`, con tipos derivados por Utility Types (`NewTask`, `UpdateTask`, `TaskSummary`) | 11.2 |
| Type guards `isTask` e `isUser` aplicados a las respuestas HTTP: los elementos con forma inválida se descartan y una respuesta que no es una lista se trata como error de carga | 11.2 |
| Arquitectura por features: `core/`, `shared/` y `features/{home,tareas,usuarios}` con barrels, alias `@core`, `@shared` y `@features`, rutas por feature (`loadChildren`), `NavbarComponent` en `core/layout`, regla de ESLint y `npm run check:architecture` | 12.2 |
| Router profesional: pantalla de login, `AuthService` (token en `sessionStorage`), `authGuard` como `canMatch` y cabecera que reacciona a la sesión; el resolver y el guard de cambios sin guardar ya existían | 13.2 |

### Diferencias del Lab 12.2 con su enunciado

- **Nombres:** las carpetas son `tareas` y `usuarios` (como en el esquema), pero los tipos siguen siendo `Task`, `User` y `TaskService`, los de la API.
- **Imports entre features:** el enunciado pide ninguno, pero `tareas` importa `usuarios` (el responsable de cada tarea). Se admite solo por el barrel y en un sentido: `usuarios` no importa `tareas`. Lo vigila la regla `features` de `npm run check:architecture` (`ALLOWED_FEATURE_DEPS`).
- **Barrels:** los tipos se exportan con `export type { … }` (`isolatedModules`) y solo exponen lo que otras partes usan (`TaskActions` es interno de `tareas`). Cada ruta de `paths` empieza por `./` (sin él, TS5090).
- **Rutas por feature:** `app.routes.ts` carga `tareas` con `loadChildren` a `tareas.routes.ts` y `home` por su barrel; es lo único que se admite importar fuera del barrel.
- **Piezas añadidas al esquema:** `core/services`, `shared/directives`, `features/home`, `tareas.routes.ts` y `task.resolver.ts`. La cabecera se extrajo a `core/layout/navbar`; `core/interceptors` y `features/usuarios/components` quedan vacías (`.gitkeep`) hasta los Labs que las usan.

### Diferencias del Lab 13.2 con su enunciado

- **`authGuard` es un `CanMatchFn`**, no un `CanActivateFn`: el enunciado lo usa en `canMatch` pero lee `state.url`, que ahí no existe (recibe los segmentos). El destino sale de la navegación en curso y, si no hay, de los segmentos.
- **URLs:** se mantienen `/tasks`, `/tasks/:id`, `/tasks/:id/edit` y `/add-task` (el enunciado habla de `/tareas`); un cambio de URL rompería enlaces y tests sin aportar nada.
- **No hay ruta `/usuarios`**: el enunciado carga `usuarios.routes`, pero la aplicación no tiene pantalla de usuarios (solo los usa como datos); la feature `usuarios` sigue sin rutas.
- **El resolver y el guard de cambios pendientes ya existían** (`taskResolver`, y `unsavedChangesGuard`, que usa el diálogo propio en lugar de `confirm()`), así que las Fases 3 y 4 no cambian código: se comprueban con los tests de rutas y con la captura.
- **El token no es un parámetro del usuario**: `login(token)` recibe un identificador opaco que genera la pantalla de login (`crypto.randomUUID()`); email y contraseña no se comprueban en ningún sitio. La clave de `sessionStorage` es `auth_token`.
- **`AuthService.autenticado` (señal)** además de `estaAutenticado()`: la cabecera necesita reaccionar sin recargar; `estaAutenticado()` sigue leyendo `sessionStorage`, que es la fuente de verdad de los guards.
- **El inicio (`/`) también exige sesión**, y la cabecera sin sesión solo muestra la marca y el tema.
- **La API:** el recorrido de las evidencias usa el backend local (`/todos` y `/users`); los tests no necesitan red.

Evidencias del Lab 13.2 en [`../../Lab 13/Lab 13.2/evidencias/`](../../Lab%2013/Lab%2013.2/evidencias/) (Network con los chunks lazy, guards en acción y resolver).

Evidencias del Lab 12.2 en [`../../Lab 12/Lab 12.2/evidencias/`](../../Lab%2012/Lab%2012.2/evidencias/) (estructura de carpetas, `ng build`, lint y arquitectura, app en marcha).

Evidencias del Lab 11.2 en [`../../Lab 11/Lab 11.2/evidencias/`](../../Lab%2011/Lab%2011.2/evidencias/) (las capturas que pide su entregable): `ng-lint.png` (salida real de `ng lint`, sin errores), `app-funcionando.png` (captura real de la aplicación en marcha, con las 200 tareas cargadas y sin cambios visibles salvo el título) y, en texto, `lint.txt` y `tsc-strict.txt`.
