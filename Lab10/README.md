# Gestor de Tareas (Angular 19)

SPA para gestionar tareas: listar, filtrar, ver detalle, crear, editar y eliminar. Consume
[JSONPlaceholder](https://jsonplaceholder.typicode.com) (`/todos` y `/users`); como la API no persiste
cambios, el estado se mantiene **en memoria** durante la sesión.

## Requisitos

- Node.js 20+
- npm

## Instalación y ejecución

```bash
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

## Estructura

```text
src/app
├── core/          modelos y servicios (TaskService, UserService)
├── shared/        pipe `taskStatus` y directiva `appHighlightUser`
└── features/      home y tasks (list, detail, edit, add, task-form reutilizable)
```

- **TaskService**: `HttpClient` + estado en `signal`. El POST/PUT/DELETE se envía a la API, pero el
  resultado local manda (la API responde siempre `id: 201`, que se ignora para no duplicar ids).
- **UserService**: carga `/users` para cruzar tarea → nombre de usuario.
- **Directiva** `appHighlightUser`: resalta nombres que empiezan por vocal (admite tildes).
- **Pipe** `taskStatus`: `Completada ✅` / `Pendiente ⏳`; además se usan `uppercase` y `date` (locale `es`).
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
