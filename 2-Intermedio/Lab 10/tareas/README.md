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
│   ├── interceptors/           auth.interceptor (Authorization: Bearer), error.interceptor (avisos centralizados), http-context (tokens)
│   ├── http/                   reintentar (2 reintentos, 1 s y 2 s) y error-notificado
│   ├── layout/navbar/          cabecera: marca, título del nivel y tema; con sesión, enlaces y «Cerrar sesión»
│   ├── services/               auth (sesión simulada), in-memory-resource (base común del estado en memoria), ignore-server-outcome,
│   │                           storage (localStorage que nunca lanza), theme, toast, confirm
│   └── api-error.ts            describeApiError: texto para el usuario cuando la API falla
├── shared/                     piezas reutilizables sin lógica de negocio; no depende de features
│   ├── components/             paginator (+ paginate(), lógica pura), state-message, confirm-dialog (<dialog>), toast
│   ├── directives/             appHighlightUser
│   ├── pipes/                  taskStatus
│   └── validators/             date-range (validador cruzado de fechas: el fin no puede ser anterior al inicio)
├── features/                   cada feature se importa solo por su barrel (`@features/<feature>`)
│   ├── home/                   index.ts
│   ├── tareas/                 index.ts + tareas.routes.ts (rutas /tasks y /add-task, cargadas con loadChildren)
│   │   ├── models/             task.model.ts (Task, NewTask…, isTask)
│   │   ├── mappers/            task.dto.ts, task.mapper.ts (DTO de la API ↔ dominio `Task`; prioridad por defecto `medium`)
│   │   ├── services/           task.service.ts (HTTP + estado en memoria), task-state.service.ts (lectura + `computed`),
│   │   │                       tasks.facade.ts (lo único que ven los componentes; incluye confirmar + modificar + avisar + Deshacer)
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
  los avisa el interceptor de errores con el texto de la operación (`describeApiError`; por ejemplo, "no se pudo conectar con el servidor. ¿Está arrancado el
  backend?"); y **"Deshacer"** recrea la tarea en el servidor con su mismo id y su fecha (`POST` con `id`), y avisa
  si el servidor responde 409 porque el id está ocupado. Por eso `restoreTask` devuelve un `Observable<boolean>` en
  lugar de un booleano. La API pública sigue funcionando exactamente como antes.
- **Borrar usuarios con el backend propio** borra también sus tareas allí (borrado en cascada). La aplicación no
  ofrece borrar usuarios, así que no se ve afectada; si se añadiera, habría que recargar las tareas después.
- **Ciclo de vida**: `TaskFormComponent.ngOnChanges` reinicia el formulario con una copia cada vez que el padre pasa
  un valor inicial; `TaskListComponent.ngOnInit` lee los filtros de la URL; `ToastService.ngOnDestroy` cancela los
  temporizadores pendientes. El resto del estado reactivo usa signals y `effect()`, que se limpian solos.
- **Pruebas**: `npm test` ejecuta 380 tests (cobertura ≈99 % de líneas; las líneas, al 100 %), incluida una prueba de integración
  de las rutas reales. 40 de ellos cubren el modo del backend propio: ids y fechas del servidor, errores que
  llegan al usuario, "Deshacer" contra la API (incluido el 409) y los formularios de crear y editar.
- **UserService** (servicio mock de `Servicios_mock.md`): listar, obtener por id, crear (POST) y eliminar (DELETE)
  usuarios en JSONPlaceholder, con estado en memoria. Se usa para cruzar tarea → nombre de usuario.
- **Directiva** `appHighlightUser`: resalta nombres que empiezan por vocal (admite tildes).
- **Pipe** `taskStatus`: `Completada ✅` / `Pendiente ⏳`; además se usan `uppercase` y `date` (locale `es`).
- **ConfirmService / ToastService**: diálogo modal (`<dialog>`) y avisos propios, en lugar de `window.confirm`.
- **Formulario**: Reactive Forms (Lab 16.2) con validaciones (título obligatorio, 3–120 caracteres y no en blanco;
  usuario obligatorio elegido de la lista; descripción de hasta 500 caracteres; fecha de fin no anterior a la de inicio;
  etiquetas de hasta 20 caracteres, como mucho 20).

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
| Capa HTTP: interceptores de autenticación y de errores (`withFetch`), reintentos con espera en la carga, DTO + mapper de tareas (`TaskDto`, `mapearTask`), contexto de cada petición (operación, errores esperados) y avisos de error centralizados; los componentes ya no gestionan los errores HTTP | 14.2 |
| Búsqueda reactiva contra la API (`debounceTime` + `distinctUntilChanged` + `switchMap`), prioridad de la tarea (modelo, formulario, tarjeta, detalle y filtro, también en la URL) y protección de doble envío con `exhaustMap` en el alta y la edición | 15.2 |
| Formulario de tarea con **Reactive Forms** (`FormBuilder`, `FormArray` de etiquetas, validador cruzado de fechas) y los campos nuevos `description`, `startDate`, `endDate` y `tags` (backend v4): modelo, DTO, mapper, tarjeta, detalle y botón desactivado mientras se guarda | 16.2 |
| Estado de aplicación: `TaskStateService` (señales de solo lectura y `computed` `pending`, `completed` y `total`) y `TasksFacade`, que sustituye a `TaskActions` y es lo único que inyectan los componentes y el resolver (regla de ESLint); crear, editar y eliminar actualizan la vista sin recargar | 17.2 |
| Testing pragmático: pruebas de la lista con la fachada simulada (`task-list.component.facade-simulada.spec.ts`) y cobertura documentada de los servicios, el guard, el validador de fechas y la lista | 18.2 |

### Diferencias del Lab 12.2 con su enunciado

- **Nombres:** las carpetas son `tareas` y `usuarios` (como en el esquema), pero los tipos siguen siendo `Task`, `User` y `TaskService`, los de la API.
- **Imports entre features:** el enunciado pide ninguno, pero `tareas` importa `usuarios` (el responsable de cada tarea). Se admite solo por el barrel y en un sentido: `usuarios` no importa `tareas`. Lo vigila la regla `features` de `npm run check:architecture` (`ALLOWED_FEATURE_DEPS`).
- **Barrels:** los tipos se exportan con `export type { … }` (`isolatedModules`) y solo exponen lo que otras partes usan (`TaskActions` desapareció en el Lab 17.2: su lógica está en `TasksFacade`). Cada ruta de `paths` empieza por `./` (sin él, TS5090).
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

### Diferencias del Lab 14.2 con su enunciado

- **API local en lugar de JSONPlaceholder.** La lista, el detalle y las escrituras usan `/todos` y `/users` del backend propio (la regla del nivel); con `npm run start:public` sigue funcionando la API pública. El enunciado fija `…/todos?_limit=20`; aquí se cargan las 200 tareas del backend, como en los demás Labs de la app.
- **El dominio sigue en inglés (`Task`)**, a petición tuya: el DTO y el mapper traducen entre la API y `Task` (`TaskDto`, `mapearTask`, `aTaskDto`, `leerTask`), pero no se renombra `Task` a `Tarea` ni se añade `prioridad` (la API no la tiene; se plantearía en el backend cuando el Lab 15 o 16 la necesiten).
- **Los DTO no salen del servicio**: `InMemoryResource` define dos ganchos, `fromApi` (valida la forma y traduce; lo que no encaja se descarta) y `toApi`; `TaskService` los implementa con el mapper. La regla `no-restricted-imports` impide importar un DTO fuera de un `*.mapper.ts`.
- **Los avisos de error los da el interceptor, no los componentes.** Para no perder los textos concretos («No se pudo eliminar la tarea: …»), cada petición declara en su `HttpContext` qué se intentaba (`OPERACION`), qué estados maneja el llamante (`ERRORES_ESPERADOS`: el 404 de `getById`, el 409 de «Deshacer») y si debe avisar (`NOTIFICAR_ERRORES`: no, con la API de mentira, que ignora sus fallos). Los componentes solo pasan `errorYaNotificado` como manejador de `error`. Si el servidor da un motivo (validación, 404 con detalle…), se muestra.
- **El 404 de una tarea inexistente no avisa**: «no existe» es una respuesta esperada y la pantalla ya dice «No se encontró la tarea». Cualquier otro error al consultarla sí se avisa.
- **Reintentos solo en la carga** (`reload`), con 2 reintentos (1 s y 2 s) si el fallo es pasajero (sin conexión o 5xx). Las escrituras no se reintentan: repetir un POST podría crear duplicados. Mientras reintenta, la lista sigue en «cargando».
- **Un solo aviso por recurso aunque haya reintentos.** Cada reintento pasa de nuevo por el interceptor; no se repite un aviso que sigue visible. Con una limitación: el aviso sale en el **primer** fallo (el interceptor no sabe si habrá reintentos), así que si el reintento acierta se habrá mostrado un aviso innecesario.
- **El 401 cierra la sesión y lleva al login** recordando la pantalla (`returnUrl`). El token es el opaco del Lab 13.2 y solo se envía a nuestra API.
- **`withFetch()`** como pide el enunciado; no cambia nada visible.

### Diferencias del Lab 15.2 con su enunciado

- **La búsqueda la hace la API** (`GET /todos?q=`), con `debounceTime(300)` + `distinctUntilChanged` + `switchMap`: el texto se recorta y, si tiene menos de 2 caracteres, equivale a no buscar. El resultado son los **ids** de las tareas que coinciden, que se cruzan con las tareas **en memoria** (que son las que mandan): una tarea editada o borrada después de buscar se ve como está ahora, no como la devolvió la API. Mientras llega una búsqueda nueva se siguen viendo los resultados anteriores y el recuento dice «buscando…»; si falla, la lista se queda como estaba y el recuento dice «no se pudo buscar» (el aviso lo da el interceptor).
- **Cambia una cosa que antes funcionaba:** la búsqueda local no distinguía tildes (`medico` encontraba «Médico»); la de la API, `LIKE` de SQLite, **no distingue mayúsculas pero sí tildes**. Y una tarea creada después de buscar no aparece en esos resultados hasta que se cambia el texto.
- **La prioridad es real** (`Task.priority`: `high`, `medium` o `low`), con un campo nuevo en el backend (`todos.priority`, migración v3, decidido contigo). El formulario ofrece un selector, las tarjetas y el detalle la muestran, y la lista la filtra con un `computed` junto con el estado y el usuario (también en la URL: `?prioridad=`). Con la API pública (`npm run start:public`), que no tiene prioridad, el mapper deja todas en `medium`.
- **Los filtros combinados no hacen peticiones**: estado, usuario y prioridad se aplican en el cliente sobre lo cargado, así que «cambiar filtros en rápida sucesión» solo recalcula la última combinación.
- **`exhaustMap` también en la edición**, no solo en la creación que pide el enunciado: los envíos pasan por un `Subject` y los que llegan con uno en curso se ignoran. El error no termina el flujo (se captura dentro) y el aviso lo da el interceptor.
- **Fase 4 (sin suscripciones manuales):** los `subscribe()` que quedan están en manejadores de eventos de peticiones HTTP de un solo uso (`TasksFacade`, antes `TaskActions`, y `reload`, que completan solos) o en los `Subject` de los formularios (cerrados con `takeUntilDestroyed()`). No hay `unsubscribe()` manual en el código nuevo. `ngOnInit` (`TaskListComponent`) y `ngOnDestroy` (`ToastService`) ya existían y no son suscripciones.
- **Evidencia**: la captura de Network muestra la petición `GET /todos?q=qu` **cancelada** por el `switchMap` al llegar la siguiente; para que hubiera una petición en vuelo se simuló una latencia de 900 ms en el navegador. En lugar de un GIF hay una secuencia de capturas reales.

### Diferencias del Lab 16.2 con su enunciado

- **Cuatro campos nuevos en el backend** (decidido contigo): `description`, `startDate`, `endDate` y `tags` (migración v4 de `todos`, validación en el servidor con las mismas reglas que el formulario y 28 tests). Son opcionales, así que el Lab 10 y el 10.1 de `1-Basico` siguen funcionando. En el dominio (`Task`) siguen los nombres en inglés (`description`, `startDate`, `endDate`, `tags`), no `descripcion`, `fechaInicio`, `fechaFin` y `etiquetas`; los campos vacíos no entran en el dominio (ausente = sin valor). Con la API pública (`npm run start:public`) estos campos no existen y no se guardan.
- **El formulario ya existía** (template-driven, del Lab 10) y se ha **convertido** a Reactive Forms en lugar de crear un `FormularioTarea` nuevo: sigue siendo reutilizado por «crear» y «editar», con el mismo contrato (`value`, `saved`, `cancelled`, `hasUnsavedChanges()`) y los mismos `id` de los campos.
- **El botón de guardar ya no se desactiva por estar inválido** (antes sí): un botón desactivado impide ver los errores al pulsarlo. Se desactiva mientras el padre guarda (`saving`, que ponen `AddTaskComponent` y `TaskEditComponent` con `finalize` sobre el `exhaustMap`), como pide la Fase 4. No se usa `markAllAsTouched` + `enviando` dentro del formulario porque él no hace la petición: la hace el padre.
- **La validación de fechas permite el mismo día** (el enunciado compara con `>` y su mensaje dice «posterior»): una tarea de un solo día es lo normal. El validador es genérico (`dateRange(startKey, endKey)`, en `shared/validators/`) y el error es del grupo (`endBeforeStart`), no de un campo.
- **Etiquetas:** `FormArray` de controles con `required`, sin espacios en blanco y `maxLength(20)`; como mucho 20 por tarea (límite del servidor). El enunciado solo pide `required` y `maxLength(20)`.
- **Al editar, vaciar un opcional lo borra**: el formulario emite los campos vacíos como `undefined` explícito (para que `{ ...task, ...draft }` los quite) y el mapper envía `null` y `[]`; el `PUT` del servidor conserva lo que no se envíe, pero lo que se envía vacío se borra.
- **No se guarda nada con la API pública**, y el recorrido de las capturas no escribe en la base de datos.

### Diferencias del Lab 17.2 con su enunciado

- **Los nombres siguen en inglés** (decidido): `TaskStateService`, `TasksFacade`, `Task`, `pending`, `completed`, `total`, en lugar de `TareaStateService`, `TareasFacade`, `Tarea`, `pendientes`, `completadas`. Solo cambia el nombre; las funciones son las del enunciado.
- **`TaskStateService` no guarda las tareas: las expone.** Ya existía un estado en memoria con `signal` (`TaskService`, sobre `InMemoryResource`), que aplica cada alta, cambio y baja cuando el servidor responde y se encarga de los reintentos de la carga. Duplicarlo en un segundo servicio habría creado dos fuentes de verdad, así que `TaskStateService` solo da `tasks` y `status` en solo lectura y calcula con `computed()` `pending`, `completed` y `total`. `cargando` y `error` del enunciado son los dos estados `loading` y `error` de `status`.
- **Crear y eliminar actualizan la vista sin recargar**, como pide el criterio, pero por la vía que ya existía (la memoria de `TaskService`). La fachada reúne las operaciones: `create` y `update` devuelven una promesa y avisan (el aviso de error lo da el interceptor, no un `catch` propio); `toggleCompleted` y `remove` absorben a `TaskActions` (confirmación, aviso y «Deshacer»), que se elimina, y se añaden `reload`, `getById` (para el resolver) y `search` (la búsqueda de la lista contra `/todos?q=`).
- **Los componentes no importan `TaskService` ni `TaskStateService`**: la lista, el alta, la edición y el resolver inyectan solo `TasksFacade` (y `UserService`, de otra feature). Una regla de ESLint lo impide para `components/**` y `task.resolver.ts` (se probó con un import temporal); los tests sí pueden usar el servicio para simularlo.
- **`TaskService` sigue exportado en el barrel** de la feature, aunque hoy solo lo usa la fachada, y se exporta además `TasksFacade`.
- **La evidencia no es una captura de Angular DevTools:** se leen los Signals reales de `TasksFacade` en la aplicación en ejecución (build de desarrollo) y se dibuja el árbol de componentes con sus nombres reales, antes y después de crear y de eliminar una tarea; el recorrido usó un backend con una base de datos temporal (`BACKEND_DB`), así que `backend/data/app.db` no cambia.
- **`ng build`:** el initial total pasa de 329,38 a 329,48 kB (sin regresión relevante). El enunciado pide además `--stats-json`; no se ha usado porque la comparación se hizo con el resumen del build.

### Diferencias del Lab 18.2 con su enunciado

- **El código de la aplicación no cambia: solo se añade una prueba.** `task-list.component.facade-simulada.spec.ts` prueba la lista con la fachada simulada (un doble con señales que controla el test, como propone la Fase 4); `task-list.component.spec.ts` la sigue probando con la fachada y el servicio reales. Todo lo demás que pide el enunciado ya estaba cubierto por los laboratorios anteriores, así que el laboratorio documenta la cobertura más que subirla.
- **Los nombres siguen en inglés** (`Task`, `TaskService`, `TasksFacade`, `ListaTareas` → `TaskListComponent`), no `Tarea`, `TareaService`, `TareasFacade` ni `ListaTareas`.
- **Servicios (`features/tareas/services/`):** 100 % de líneas, ramas y funciones (el enunciado pide > 70 %). Se prueba contra el backend local y con la API pública, con `provideHttpClient()` + `provideHttpClientTesting()` en lugar de `HttpClientTestingModule`, obsoleto. El caso «404 → `null`» del enunciado lo cubren las pruebas de la base `InMemoryResource` (`in-memory-resource*.spec.ts`, de `getById`), y el mapeo del DTO, `task.mapper.spec.ts`.
- **El guard** es un `CanMatchFn` (`authGuard`), con el 100 %: con sesión pasa y sin ella redirige a `/login` con `returnUrl`.
- **Validadores:** hay uno propio, `dateRange` (el enunciado habla de `fechasValidas`), con casos positivos (fin posterior, mismo día, alguna fecha vacía) y negativos (fin anterior, no legible como fecha, error en el grupo).
- **La evidencia es la salida real de `ng test --code-coverage`** y una tabla con la cobertura de cada artefacto sacada del informe generado; no es una captura de la ventana del terminal.

Evidencias del Lab 18.2 en [`../../Lab 18/Lab 18.2/evidencias/`](../../Lab%2018/Lab%2018.2/evidencias/) (resumen de cobertura de Karma y cobertura de los artefactos).

Evidencias del Lab 17.2 en [`../../Lab 17/Lab 17.2/evidencias/`](../../Lab%2017/Lab%2017.2/evidencias/) (árbol de componentes y Signals de la fachada, con crear y eliminar sin recargar).

Evidencias del Lab 16.2 en [`../../Lab 16/Lab 16.2/evidencias/`](../../Lab%2016/Lab%2016.2/evidencias/) (errores visibles, formulario sin errores y `FormArray` de etiquetas en uso).

Evidencias del Lab 15.2 en [`../../Lab 15/Lab 15.2/evidencias/`](../../Lab%2015/Lab%2015.2/evidencias/).

Evidencias del Lab 14.2 en [`../../Lab 14/Lab 14.2/evidencias/`](../../Lab%2014/Lab%2014.2/evidencias/) (Network con la cabecera `Authorization` y la notificación de error en pantalla).

Evidencias del Lab 13.2 en [`../../Lab 13/Lab 13.2/evidencias/`](../../Lab%2013/Lab%2013.2/evidencias/) (Network con los chunks lazy, guards en acción y resolver).

Evidencias del Lab 12.2 en [`../../Lab 12/Lab 12.2/evidencias/`](../../Lab%2012/Lab%2012.2/evidencias/) (estructura de carpetas, `ng build`, lint y arquitectura, app en marcha).

Evidencias del Lab 11.2 en [`../../Lab 11/Lab 11.2/evidencias/`](../../Lab%2011/Lab%2011.2/evidencias/) (las capturas que pide su entregable): `ng-lint.png` (salida real de `ng lint`, sin errores), `app-funcionando.png` (captura real de la aplicación en marcha, con las 200 tareas cargadas y sin cambios visibles salvo el título) y, en texto, `lint.txt` y `tsc-strict.txt`.
