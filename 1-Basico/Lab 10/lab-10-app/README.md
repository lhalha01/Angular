# Gestor de Tareas (Angular 20)

SPA para gestionar tareas: listar, filtrar, ver detalle, crear, editar y eliminar. Consume
[JSONPlaceholder](https://jsonplaceholder.typicode.com) (`/todos` y `/users`); como la API no persiste
cambios, el estado se mantiene **en memoria** durante la sesión.

## Requisitos

- Node.js **≥ 20.19 y < 22** (Angular 20 exige 20.19 o superior; el curso exige menos de 22)
- npm

## Instalación y ejecución

En el repositorio la app está en `1-Basico/Lab 10/lab-10-app`. Es un proyecto **autónomo**: tiene su propio
`package.json` y `package-lock.json`, y no depende de ningún otro proyecto (los Labs 01 a 09 comparten
el `node_modules` de `1-Basico`; este no).

```bash
cd "1-Basico/Lab 10/lab-10-app"
npm install                      # instala exactamente lo fijado en package-lock.json
npm start                        # http://localhost:4200/
```

Para instalar de forma reproducible y verificando los hashes del lockfile se puede usar `npm ci`.

Otros comandos: `npm run build` (producción) y `npm test` (Karma + Jasmine; en CI:
`npx ng test --watch=false --browsers=ChromeHeadless`).

## Rutas

| Ruta | Componente |
| --- | --- |
| `/` | `HomeComponent` |
| `/tasks` | `TaskListComponent` (búsqueda, filtros, orden y paginación; borrado con diálogo de confirmación) |
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
