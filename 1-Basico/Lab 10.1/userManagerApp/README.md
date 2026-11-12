# Gestor de Usuarios (Lab 10.1)

Práctica final de Angular básico. Aplicación para **listar, consultar, crear, editar y eliminar usuarios**
consumiendo una API mockeada con `HttpClient`.

- Angular **20.3** (componentes standalone, signals, control flow `@if` / `@for`)
- API: [JSONPlaceholder](https://jsonplaceholder.typicode.com/users)
- Avatares generados dinámicamente con [UI Avatars](https://ui-avatars.com/)

## Requisitos

- Node.js **20.19 o superior y menor que 22** (el curso fija `Node < 22.0.0`)
- npm 10 o superior

## Instalación y ejecución

Este proyecto es **autónomo**: tiene su propio `package.json` y `package-lock.json`, y no depende de
ningún otro proyecto del repositorio (los Labs 01 a 09 comparten el `node_modules` de `1-Basico`; este no).

```bash
cd "1-Basico/Lab 10.1/userManagerApp"
npm install             # instala exactamente lo fijado en package-lock.json
npm start               # http://localhost:4200/

# tests unitarios (necesitan Chrome o Chromium)
npx ng test --watch=false --browsers=ChromeHeadless

# compilación de producción
npm run build
```

Para instalar de forma reproducible y verificando los hashes del lockfile se puede usar `npm ci`.

### Opcional: con el backend propio (los cambios se guardan)

Por defecto la aplicación usa la API pública (JSONPlaceholder), que **no guarda** los cambios: se pierden al
recargar. Con el backend de la carpeta [`backend/`](../../../backend/README.md) del repositorio (FastAPI +
SQLite) sí se guardan. Necesita Python 3.11 o superior. En dos terminales:

```bash
# 1. backend (desde la carpeta backend/ del repositorio)
.\start.cmd              # Windows;  en Linux/macOS: ./start.sh

# 2. aplicación, en la configuración "local"
cd "1-Basico/Lab 10.1/userManagerApp"
npm run start:local      # http://localhost:4200/, hablando con http://localhost:8000
```

**Detección automática:** al arrancar, la aplicación hace **una sola** comprobación (`GET /health`, máximo 1,5 s) y
elige la fuente de datos: si el backend está activo, lo usa (los cambios se guardan); si no, usa JSONPlaceholder.
Por eso basta con `npm start`: no hace falta `start:local`, y la aplicación no falla si el backend está apagado.
Para cambiar de fuente hay que recargar la página (el mensaje de la consola indica cuál se eligió). Código en
`src/environments/detect-backend.ts`; la URL y el modo `persistentApi` salen de ahí (véase `src/environments/`).

## Rutas

| Ruta               | Componente   | Descripción                                   |
| ------------------ | ------------ | --------------------------------------------- |
| `/`                | `Home`       | Página de bienvenida                          |
| `/users`           | `UserList`   | Lista con búsqueda y paginación               |
| `/users/:id`       | `UserDetail` | Detalle del usuario                           |
| `/users/:id/edit`  | `UserEdit`   | Edición (ruta hija de `/users`) — *extra*     |
| `/add-user`        | `AddUser`    | Formulario de alta                            |

Todas las rutas se cargan con *lazy loading* (`loadComponent`).

## Requisitos cubiertos

| Requisito | Dónde |
| --- | --- |
| `HttpClient` y servicio `User` (`getUsers`, `getUser`, `addUser`, `deleteUser` + `updateUser`) | `src/app/services/user.ts` |
| `@for` y `@if` (estado "no hay usuarios", carga, error) | `features/user-list/user-list.html` |
| Directiva personalizada: resalta ids pares | `directives/highlight-even.ts` |
| Pipes built-in: `uppercase`, `date` | lista y detalle |
| Pipe personalizado de nombre: `Sr. Apellido, Nombre` | `pipes/full-name-pipe.ts` |
| `[(ngModel)]` en el formulario, interpolación, property y event binding | `features/user-form/` |
| Routing con parámetros y rutas hijas | `app.routes.ts` |

**Extras:** paginación, filtro por nombre/email con pipe personalizado (`pipes/filter-users-pipe.ts`),
edición en `/users/:id/edit` con validadores (obligatorios, longitud mínima, email, teléfono y web),
notificaciones tras crear / editar / eliminar (`services/notification.ts` + `shared/toast`) y
estado en memoria.

## Decisiones de diseño

- **API.** El enunciado menciona Reqres pero lista endpoints de JSONPlaceholder, que es la que se usa.
  JSONPlaceholder devuelve un único campo `name`; el servicio lo separa en nombre y apellidos
  (quitando tratamientos como "Mrs.") y los vuelve a unir al enviarlo. La API no ofrece avatar ni
  fecha de alta: el avatar se genera con UI Avatars y la fecha de alta es simulada (1-ene-2024 + id días).
- **Estado en memoria.** JSONPlaceholder no guarda cambios (el POST siempre devuelve el id 11, por
  ejemplo). El servicio carga la lista una vez y a partir de ahí mantiene el estado en un *signal*;
  crear, editar y borrar se reflejan al instante durante la sesión (al recargar la página se pierde).
  Las llamadas `POST`/`PUT`/`DELETE` se siguen realizando, salvo para usuarios creados en local,
  que la API no conoce.
- **Dos modos de API (`environment.persistentApi`).** Con el backend propio (configuración `local`), el
  servicio cambia de comportamiento: el id de un alta lo asigna el servidor, **todas** las escrituras llegan a
  la API (también las de usuarios creados en esta sesión), la edición usa **PATCH** (un PUT borraría el alias, la
  dirección completa y demás campos que el formulario no tiene) y un error de la API llega al usuario en lugar
  de ignorarse. En ambos modos la memoria sigue siendo lo que leen las vistas.
- **Borrar un usuario avisa de sus tareas (backend propio).** En el backend, las tareas (`/todos`) pertenecen a un
  usuario y se borran en cascada con él. Antes de confirmar, la aplicación pregunta cuántas tiene
  (`GET /todos?userId=…&_limit=1`, leyendo la cabecera `X-Total-Count`, sin descargar ninguna) y lo dice: *"Ana tiene
  20 tareas asignadas. Si lo eliminas, también se eliminarán sus 20 tareas. Esta acción no se puede deshacer."* Al
  terminar, el aviso lo repite (`eliminado junto con sus 20 tareas`). Un usuario sin tareas se confirma como siempre.
  Si no se puede comprobar el número de tareas, **no se pregunta ni se borra nada** (el usuario confirmaría sin
  saber qué pierde) y se explica en un aviso. Con la API pública no hay cascada, así que no se consulta nada y todo
  funciona como antes. Lista y detalle comparten esta lógica en `services/user-actions.ts`.
- **Paginación.** Se pagina sobre el estado en memoria (5 usuarios por página), no con `_page`/`_limit`
  de la API. Con altas y bajas solo locales, las páginas del servidor dejarían de coincidir con lo
  que se muestra; paginar la copia en memoria mantiene el filtro, la paginación y los cambios coherentes.
  Es un compromiso asumido entre dos requisitos que chocan. El backend propio sí admite `_page`/`_limit`
  y `q`, pero la aplicación aún no los usa: seguiría paginando en memoria en los dos modos.
- **Dónde se procesa el filtro.** `FilterUsersPipe` se instancia también desde el componente para
  poder paginar el resultado filtrado.

## Tests

49 tests unitarios (servicios con `HttpTestingController`, pipes y componente de lista):
normalización de datos, caché en memoria, alta / edición / borrado, filtro, paginación,
resaltado de ids pares y confirmación de borrado. Siete de ellos cubren el modo del backend propio
(`persistentApi`): id asignado por el servidor, PATCH en lugar de PUT, escrituras de usuarios creados
y propagación de errores de la API. Otros 20 cubren el borrado con aviso de tareas (`UserActions` y
`User.countTasks`): textos en singular y plural, cancelar, aceptar, usuario sin tareas, fallo al consultar las
tareas, cabecera ausente o inválida, fallo al borrar y API pública sin consultas.

## Integridad de paquetes y vulnerabilidades (2026-11-10)

Comprobado en esta carpeta, con su propio `node_modules` y `package-lock.json`:

- **Integridad:** `npm audit signatures` → **541 paquetes con firma de registro verificada** y 124 con
  atestaciones. Las 628 entradas del lockfile llevan hash de integridad y ninguna procede de un origen
  distinto del registro de npm. Sin paquetes alterados ni dependencias inesperadas.
- **`npm audit --omit=dev` (lo que llega al navegador): 0 vulnerabilidades.**
- **`npm audit` completo: 16, todas de gravedad moderada** (0 altas, 0 críticas) y todas en la cadena de
  `@angular/cli` (`minimatch` ReDoS, `glob`, `sigstore`, `pacote`…), una herramienta que solo se usa al
  compilar y no se incluye en el bundle. `npm audit fix --force` propone **bajar a `@angular/cli@17`**,
  un retroceso incompatible con Angular 20, así que no se aplica: se documenta.
- **Versiones:** Angular 20.3 (CLI 20.3.42), TypeScript 5.9 y `rxjs` 7.8, las últimas de la línea 20 y las
  que exige el curso (`Lab 01`: Angular 20, Node < 22). Angular 21 es estable y también admite Node 20.19,
  por lo que sería la siguiente migración posible; Angular 22 exige Node ≥ 22.22 y no es compatible con el
  requisito del curso.
