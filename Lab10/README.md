# Gestor de Tareas (Angular 19)

SPA para gestionar tareas: listar, filtrar, ver detalle, crear, editar y eliminar. Consume
[JSONPlaceholder](https://jsonplaceholder.typicode.com) (`/todos` y `/users`); como la API no persiste
cambios, el estado se mantiene **en memoria** durante la sesión.

## Requisitos

- Node.js 20+
- npm

## Instalación y ejecución

Si vienes del repositorio, la app está en la carpeta `Lab10`:

```bash
cd Lab10
npm install
npm start          # http://localhost:4200/
```

Otros comandos: `npm run build` (producción) y `npm test` (Karma + Jasmine; en CI:
`npx ng test --watch=false --browsers=ChromeHeadless`).

## Rutas

| Ruta | Componente |
| --- | --- |
| `/` | `HomeComponent` |
| `/tasks` | `TaskListComponent` (filtro por estado, borrado con `window.confirm`) |
| `/tasks/:id` | `TaskDetailComponent` |
| `/tasks/:id/edit` | `TaskEditComponent` (ruta hija de `:id`) |
| `/add-task` | `AddTaskComponent` |

Todas se cargan con `loadComponent` (lazy) y el `:id` llega como `input()` (`withComponentInputBinding`).
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
├── core/                  modelos y servicios sin interfaz
│   ├── in-memory-resource.ts   base común de TaskService y UserService (estado en memoria)
│   ├── ignore-server-outcome.ts  qué se hace con las respuestas de la API simulada
│   └── storage.service.ts      localStorage que nunca lanza (tema y vista)
├── shared/                piezas reutilizables sin lógica de negocio
│   ├── paginator/         <app-paginator> + paginate() (lógica pura)
│   ├── state-message/     tarjeta de estado: cargando, error, vacío, no encontrado
│   ├── confirm-dialog/    modal sobre <dialog>
│   ├── toast/             avisos
│   └── pipes/, directives/
└── features/
    ├── home/
    └── tasks/
        ├── task-list/     pantalla; task-query.ts (filtrar/ordenar) y task-list-params.ts (URL) son funciones puras
        ├── task-card/     tarjeta/fila de una tarea (componente "tonto": inputs y outputs)
        ├── task-toolbar/  búsqueda, filtros, orden y vista (cada control es un `model()`)
        ├── task-form/     formulario compartido por "crear" y "editar"
        ├── task-detail/, task-edit/, add-task/
        ├── task-actions.service.ts   confirmar + modificar + avisar (+ Deshacer)
        └── task.resolver.ts          carga la tarea de `:id` antes de activar la ruta
```

- **La lista solo orquesta** (≈190 líneas): guarda el estado de la consulta, lo sincroniza con la URL y delega.
  La lógica está en funciones puras con tests propios; la presentación, en componentes pequeños.
- **Resolver**: `tasks/:id` resuelve la tarea una vez y las rutas hijas (detalle y edición) la reciben como
  `input()`. `runGuardsAndResolvers: 'always'` la recarga tras editar, para no mostrar datos antiguos.
- **Estado en memoria sin duplicar**: `TaskService` y `UserService` extienden `InMemoryResource` (carga, signal,
  búsqueda por id, añadir/actualizar/borrar/restaurar) y solo aportan su vocabulario y sus reglas.
- **API simulada**: las escrituras (POST/PUT/DELETE) se envían, pero `ignoreServerOutcome` hace explícito, en un único
  sitio, que ni su respuesta ni su error cambian el resultado. Con una API real habría que quitarlo para que los
  errores llegaran al usuario. Los errores de la carga inicial sí se muestran (con "Reintentar").
- **Ciclo de vida**: `TaskFormComponent.ngOnChanges` reinicia el formulario con una copia cada vez que el padre pasa
  un valor inicial; `TaskListComponent.ngOnInit` lee los filtros de la URL; `ToastService.ngOnDestroy` cancela los
  temporizadores pendientes. El resto del estado reactivo usa signals y `effect()`, que se limpian solos.
- **Pruebas**: `npm test` ejecuta ≈180 tests (cobertura ≈98 % de líneas), incluida una prueba de integración
  de las rutas reales.

- **TaskService**: `HttpClient` + estado en `signal`. El POST/PUT/DELETE se envía a la API, pero el
  resultado local manda (la API responde siempre `id: 201`, que se ignora para no duplicar ids).
- **UserService** (servicio mock de `Servicios_mock.md`): listar, obtener por id, crear (POST) y eliminar (DELETE)
  usuarios en JSONPlaceholder, con estado en memoria. Se usa para cruzar tarea → nombre de usuario.
- **Directiva** `appHighlightUser`: resalta nombres que empiezan por vocal (admite tildes).
- **Pipe** `taskStatus`: `Completada ✅` / `Pendiente ⏳`; además se usan `uppercase` y `date` (locale `es`).
- **ConfirmService / ToastService**: diálogo modal (`<dialog>`) y avisos propios, en lugar de `window.confirm`.
- **Formulario**: template-driven con `[(ngModel)]` y validaciones (título obligatorio, 3–120 caracteres y
  no en blanco; usuario obligatorio elegido de la lista).

## Seguridad de dependencias

- Integridad: `npm audit signatures` → todos los paquetes con firma de registro verificada.
- Versiones: última rama estable 19.x de Angular (core 19.2.25, CLI 19.2.27).
- `npm audit` reporta vulnerabilidades (la salida completa se puede regenerar con `npm audit`):
  - **Herramientas de desarrollo** (`@angular-devkit/build-angular`, webpack-dev-server, vite, `tar`, `piscina`…):
    no se incluyen en el bundle de producción; afectan solo a quien ejecuta el servidor de desarrollo o la compilación.
  - **Runtime** (`npm audit --omit=dev`: `@angular/core`, `compiler`, `router`…): avisos de XSS/sanitización que
    afectan a i18n, hidratación SSR y bindings de host. Esta app no usa i18n ni SSR/hidratación y no enlaza HTML
    no confiable, pero **la corrección real es migrar a Angular 21**.
- `npm audit fix` (sin `--force`) no aporta correcciones; `--force` implica un salto mayor a Angular 21,
  fuera del alcance de la práctica (Angular 19), por lo que se documenta en lugar de aplicarlo.
