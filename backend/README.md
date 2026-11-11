# Backend de los laboratorios de Angular

APIs REST locales (**FastAPI + SQLite**) que sustituyen a las APIs públicas de mentira (JSONPlaceholder)
y, a diferencia de ellas, **guardan los cambios**: lo que creas, editas o borras sigue ahí al recargar
la página o al reiniciar el servidor.

Hoy ofrece `/users` (Lab 10.1 y Lab 10) y `/todos` (Lab 10). Está organizado para ir añadiendo más
recursos como routers independientes.

> **Guía paso a paso** (arrancar el backend y usarlo desde Angular): [GUIA.md](GUIA.md). Este README es la
> referencia técnica.

## Requisitos

- **Python 3.11 o superior** (probado con 3.13).
- Conexión a internet solo la primera vez, para instalar las dependencias.

No hace falta instalar nada más: ni base de datos (SQLite viene con Python) ni Docker.

## Arrancar el backend

Desde la carpeta `backend/`:

| Sistema | Comando |
| --- | --- |
| Windows (cmd o PowerShell) | `.\start.cmd` |
| Linux / macOS | `./start.sh` |

El script crea un entorno virtual (`.venv`) la primera vez, instala las dependencias de
`requirements.txt`, crea la base de datos con los datos iniciales y arranca el servidor en
**http://localhost:8000**. La documentación interactiva (probar los endpoints desde el navegador)
está en **http://localhost:8000/docs**.

Opciones (se pasan al script):

```bash
.\start.cmd --port 8001     # otro puerto (por defecto, 8000)
.\start.cmd --reset         # borra la base de datos y vuelve a los datos iniciales
```

<details>
<summary>Arranque manual, sin los scripts</summary>

```bash
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt        # en Windows: .venv\Scripts\python
.venv/bin/python run.py
```

</details>

## Usarlo desde un laboratorio

Con el backend en marcha, en otra terminal:

```bash
cd "1-Basico/Lab 10.1/userManagerApp"
npm run start:local          # http://localhost:4200/, hablando con el backend
```

`npm start` (sin `:local`) sigue usando la API pública y no necesita el backend.

```bash
cd "1-Basico/Lab 10/lab-10-app"
npm run start:local          # el Lab 10 (Gestor de Tareas) con /todos y /users
```

Las aplicaciones de los dos labs son opcionalmente compatibles con este backend: por defecto siguen usando la
API pública.

## Endpoints de `/users`

Compatibles con el formato de JSONPlaceholder (`id`, `name`, `username`, `email`, `phone`, `website`,
`address`, `company`).

| Método y ruta | Qué hace | Respuesta |
| --- | --- | --- |
| `GET /users` | Lista usuarios. Parámetros opcionales: `_page` y `_limit` (paginación, límite máximo 100) y `q` (busca en nombre, usuario y email). La cabecera `X-Total-Count` indica el total antes de paginar | 200 |
| `GET /users/{id}` | Un usuario | 200, o 404 |
| `POST /users` | Crea un usuario. El **id lo asigna el servidor** y no se reutiliza si se borra. Si se envía un `id`, se usa si está libre (si no, **409**): sirve para restaurar un usuario borrado | 201 |
| `PUT /users/{id}` | Sustituye el usuario completo (lo que no se envía queda vacío) | 200, o 404 |
| `PATCH /users/{id}` | Cambia solo los campos enviados; `address` y `company` se combinan con los existentes | 200, o 404 |
| `DELETE /users/{id}` | Borra el usuario **y, en cascada, todas sus tareas** (`/todos`) | 204, o 404 |
| `GET /health` | Comprobación de que el servidor responde | 200 |

`name` y `email` son obligatorios y se validan (nombre de 1 a 120 caracteres, email con formato válido);
un cuerpo no válido devuelve 422 y no guarda nada.

## Endpoints de `/todos`

Tareas con el formato de JSONPlaceholder (`id`, `userId`, `title`, `completed`) más `createdAt`, la fecha de
creación en ISO 8601 UTC (como `Date.toISOString()`), que JSONPlaceholder no tiene.

| Método y ruta | Qué hace | Respuesta |
| --- | --- | --- |
| `GET /todos` | Lista tareas, ordenadas por id. Filtros opcionales: `userId`, `completed` y `q` (busca en el título). Con `_page` y `_limit` (máx. 200) pagina; sin `_limit` devuelve todas. `X-Total-Count` es el total ya filtrado y antes de paginar | 200 |
| `GET /todos/{id}` | Una tarea | 200, o 404 |
| `POST /todos` | Crea una tarea. **Id y fecha los asigna el servidor**; si se envían `id` y/o `createdAt`, se respetan (el `id` solo si está libre, si no **409**). Así se **restaura** una tarea borrada tal como era | 201 |
| `PUT /todos/{id}` | Sustituye la tarea. La fecha de creación y el id no cambian aunque vengan en el cuerpo | 200, o 404 |
| `PATCH /todos/{id}` | Cambia solo los campos enviados | 200, o 404 |
| `DELETE /todos/{id}` | Borra la tarea | 204, o 404 |

Validación (las mismas reglas que el formulario del Lab 10): `title` de 3 a 120 caracteres y no en blanco;
`userId` obligatorio y **debe ser un usuario existente** (si no, 422).

**Relación con `/users`:** `userId` es una clave foránea real hacia `users` (la impone la propia base de
datos, no solo la API), con **borrado en cascada**: al borrar un usuario se borran también todas sus tareas.
Las tareas de los demás usuarios no se tocan. Restaurar un usuario (`POST /users` con su `id`) no restaura
sus tareas. El Lab 10.1 avisa de ello antes de borrar: consulta `GET /todos?userId=…&_limit=1` y lee el total de la
cabecera `X-Total-Count` (por eso esa cabecera está expuesta a CORS).

## Datos y persistencia

- La base de datos es el archivo `data/app.db`. **El repositorio incluye una con los datos de ejemplo** (10 usuarios y
  200 tareas, los de JSONPlaceholder), así que quien clone parte de ella sin hacer nada. Si el archivo no existe, se
  crea solo al arrancar. Es el único archivo de `data/` que se versiona (véase "La base de datos en git").
- Cuando se crea de cero, se rellena con esos mismos 10 usuarios y 200 tareas (copiados una vez en
  `app/seed/`, así que no hace falta internet para usarlo). A cada tarea se le asigna una fecha de creación
  distinta (un minuto más antigua por cada id).
- Los datos iniciales se cargan **tabla a tabla, solo cuando la tabla es nueva**. Así, una base de datos
  anterior recibe un recurso añadido después (por ejemplo `/todos`) sin perder nada de lo que tenía, y si
  borras todos los registros de un recurso, al reiniciar no reaparecen.
- Si la base de datos ya existía y se había borrado algún usuario, al sembrar `/todos` se omiten las tareas
  iniciales de esos usuarios (la clave foránea lo exige).
- Para volver a los datos de JSONPlaceholder (10 usuarios y 200 tareas): `--reset`, o borrar `data/app.db`.

### La base de datos en git

`data/app.db` está versionada, pero **cambia cada vez que usas el backend**: crear, editar o borrar algo en una
aplicación modifica ese archivo, y git lo mostrará como modificado. Es un archivo binario, así que no se puede
fusionar ni revisar línea a línea. Para no subir tus cambios sin querer:

```bash
git restore backend/data/app.db                            # vuelve a la base de datos del repositorio
git update-index --skip-worktree backend/data/app.db       # que git ignore tus cambios locales
git update-index --no-skip-worktree backend/data/app.db    # deshacer lo anterior, si quieres subirla de nuevo
```

`--reset` también modifica el archivo (lo recrea con los datos de JSONPlaceholder).

### Migraciones

La versión del esquema se guarda en la propia base de datos (`PRAGMA user_version`). Al arrancar, una base
de datos anterior se migra sola:

- **Versión 2 (relación `todos` → `users`):** SQLite no permite añadir una clave foránea a una tabla existente,
  así que se reconstruye `todos`, conservando ids, fechas y el contador de ids (un id borrado nunca se
  reutiliza). Las tareas **huérfanas** (de usuarios que ya no existen) **se eliminan**, porque con la
  relación en cascada habrían desaparecido al borrar su usuario. El arranque lo avisa con un mensaje
  (`se eliminaron N tareas huérfanas`). Si te interesa conservarlas, haz una copia de `data/app.db` antes de
  arrancar con la versión nueva.
- Se puede usar otro archivo con la variable de entorno `BACKEND_DB`.

## Seguridad

Pensado para uso local y didáctico:

- Escucha solo en `127.0.0.1` (únicamente accesible desde tu equipo). Para exponerlo hay que pedirlo
  expresamente con `--host`.
- **No tiene autenticación**: no lo publiques en internet tal cual.
- CORS limitado a `localhost` y `127.0.0.1` (cualquier puerto), que es donde corre `ng serve`.

## Tests

```bash
.venv/bin/python -m pip install -r requirements-dev.txt     # en Windows: .venv\Scripts\python
.venv/bin/python -m pytest
```

109 tests: listado, filtros, paginación, búsqueda, alta, PUT, PATCH, borrado, validaciones, restauración de
registros borrados, la relación entre tareas y usuarios (incluido el borrado en cascada, también impuesto
por la base de datos), CORS, persistencia (los cambios sobreviven a reiniciar el servidor) y las migraciones
de una base de datos existente (huérfanas, ids, fechas y reintentos).

`tests/test_live_server.py` arranca un servidor real (uvicorn). Es necesario porque `TestClient` es secuencial y
espera a que la aplicación termine del todo, y no puede detectar fallos que sí sufre un cliente real:

- **Confirmar el cambio *después* de enviar la respuesta:** un cliente rápido que lee justo tras escribir veía datos
  antiguos. Se corrige con `Depends(get_db, scope="function")`.
- **Peticiones simultáneas** (un navegador pide `/todos` y `/users` a la vez): sin `check_same_thread=False` en la
  conexión a SQLite casi todas fallaban con un 500 (que además sale sin cabeceras de CORS, así que el navegador lo
  muestra como un error de CORS). Es seguro porque cada conexión pertenece a una sola petición.

Sin esas dos líneas, estos tests fallan.

## Estructura

```text
backend/
├── app/
│   ├── main.py          aplicación FastAPI, CORS y routers
│   ├── config.py        rutas y CORS
│   ├── db.py            SQLite: esquema, datos iniciales por tabla, conexión por petición
│   ├── schemas.py       validación y forma de las respuestas
│   ├── routers/         un router por recurso: users.py y todos.py
│   └── seed/            datos iniciales: users.json y todos.json
├── tests/               pytest
├── run.py               arranque del servidor (--port, --host, --reset)
├── start.cmd / start.sh crean el entorno virtual, instalan dependencias y arrancan
└── requirements*.txt    dependencias con versiones fijadas
```

## Añadir un recurso nuevo

1. Datos iniciales en `app/seed/<recurso>.json`, y su esquema y su carga en `app/db.py` (lista `RESOURCES`).
2. Esquemas en `app/schemas.py` y el router en `app/routers/<recurso>.py` (se puede copiar `users.py`).
3. Registrarlo con `app.include_router(...)` en `app/main.py` y añadirlo a la lista de `GET /`.
4. Sus tests en `tests/`.

## Dependencias e integridad

- `requirements.txt` fija **todas** las versiones, directas y transitivas (solo FastAPI y Uvicorn son
  directas), para que la instalación sea reproducible.
- `pip check`: sin conflictos. `pip-audit -r requirements.txt` (2026-11-11): **sin vulnerabilidades
  conocidas**.
- Las herramientas de prueba y auditoría están aparte, en `requirements-dev.txt`, y no hacen falta para
  ejecutarlo.
