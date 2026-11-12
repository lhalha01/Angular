"""Acceso a SQLite: creación del esquema, datos iniciales y conexión por petición.

Se usa el módulo `sqlite3` de la biblioteca estándar (sin ORM) para que el proyecto
tenga las mínimas dependencias. Cada petición abre su propia conexión, porque FastAPI
ejecuta los endpoints síncronos en hilos distintos y las conexiones SQLite no se comparten.
"""

import json
import logging
import sqlite3
from collections.abc import Callable, Iterator
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import Request

from .config import SEED_DIR

logger = logging.getLogger("uvicorn.error")

# Roles de un empleado (el dominio de TalentHub). Son datos del recurso /users desde el esquema 5.
ROLES = ("desarrollador", "diseñador", "qa", "devops", "manager")
PROJECT_STATUSES = ("active", "paused", "completed")

_USERS_BASE_COLUMNS = """
    -- AUTOINCREMENT evita reutilizar el id de un usuario borrado.
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    username TEXT,
    email    TEXT NOT NULL,
    phone    TEXT,
    website  TEXT,
    address  TEXT,   -- objeto JSON (street, suite, city, zipcode, geo)
    -- `company` es un objeto JSON (name, catchPhrase, bs); va el último y sin comentario detrás para poder añadir columnas.
    company  TEXT
"""

# Columnas que añade el esquema 5 a `users` (datos del empleado). Todas tienen valor por defecto u opcionales, así
# que los clientes anteriores (Lab 10 y 10.1) siguen funcionando sin enviarlas.
EMPLOYEE_COLUMNS = {
    "role": f"role TEXT NOT NULL DEFAULT 'desarrollador' CHECK (role IN ({', '.join(repr(r) for r in ROLES)}))",
    "skills": "skills TEXT NOT NULL DEFAULT '[]'",  # lista JSON de {name, level}
    "available": "available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))",
    # El proyecto al que está asignado; al borrar el proyecto, la persona queda sin proyecto.
    "project_id": "project_id INTEGER REFERENCES projects (id) ON DELETE SET NULL",
    "hired_at": "hired_at TEXT",  # día ISO (AAAA-MM-DD) de incorporación
}

# Esquema de `users` hasta la versión 4 (sin datos de empleado): lo usan las migraciones y las pruebas de bases antiguas.
USERS_SCHEMA_V4 = f"CREATE TABLE users ({_USERS_BASE_COLUMNS});"

USERS_SCHEMA = f"""
CREATE TABLE users (
{_USERS_BASE_COLUMNS.rstrip()},
    {(","+chr(10)+"    ").join(EMPLOYEE_COLUMNS.values())}
);
CREATE INDEX idx_users_project_id ON users (project_id);
"""

PROJECTS_SCHEMA = f"""
CREATE TABLE projects (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    client     TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ({', '.join(repr(s) for s in PROJECT_STATUSES)})),
    start_date TEXT NOT NULL,  -- día ISO (AAAA-MM-DD)
    end_date   TEXT            -- día ISO, no anterior al de inicio; opcional
);
"""

TODOS_COLUMNS = """
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Clave foránea: una tarea siempre pertenece a un usuario que existe. Al borrar un usuario se
    -- borran también sus tareas (ON DELETE CASCADE).
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,  -- ISO 8601 en UTC, p. ej. 2026-11-11T09:30:00.000Z
    priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    description TEXT,                      -- opcional
    start_date TEXT,                       -- opcional: día ISO (AAAA-MM-DD)
    end_date   TEXT,                       -- opcional: día ISO (AAAA-MM-DD), no anterior al de inicio
    tags       TEXT NOT NULL DEFAULT '[]'  -- lista JSON de etiquetas
"""

TODOS_SCHEMA = f"""
CREATE TABLE todos ({TODOS_COLUMNS});
CREATE INDEX idx_todos_user_id ON todos (user_id);
"""

# Versión del esquema (PRAGMA user_version). Las bases de datos anteriores valen 0.
#   2: `todos.user_id` pasa a ser una clave foránea hacia `users` con borrado en cascada.
#   3: `todos.priority` ('high' | 'medium' | 'low', por defecto 'medium').
#   4: `todos.description`, `todos.start_date`, `todos.end_date` y `todos.tags` (todas opcionales).
#   5: tabla `projects` y los datos de empleado en `users` (`role`, `skills`, `available`, `project_id`, `hired_at`).
SCHEMA_VERSION = 5

# Prioridad de las tareas iniciales: se reparte según el id (1 → media, 2 → baja, 0 → alta) para que el
# filtro por prioridad tenga algo que filtrar en los datos de ejemplo.
SEED_PRIORITIES = {0: "high", 1: "medium", 2: "low"}


def now_iso(moment: datetime | None = None) -> str:
    """Fecha en el mismo formato que `Date.toISOString()` de JavaScript."""
    moment = moment or datetime.now(timezone.utc)
    return moment.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def connect(db_path: Path) -> sqlite3.Connection:
    # `check_same_thread=False`: FastAPI abre la conexión (dependencia), la usa el endpoint y la
    # cierra en hilos distintos del pool, así que SQLite la rechazaría con "objects created in a
    # thread can only be used in that same thread" en cuanto llegan peticiones simultáneas. Es
    # seguro porque cada conexión pertenece a UNA sola petición: nunca se usa desde dos hilos a la vez.
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # SQLite no aplica las claves foráneas salvo que se active en cada conexión.
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _seed_projects(conn: sqlite3.Connection) -> None:
    projects = json.loads((SEED_DIR / "projects.json").read_text(encoding="utf-8"))
    conn.executemany(
        "INSERT INTO projects (id, name, client, status, start_date, end_date) "
        "VALUES (:id, :name, :client, :status, :startDate, :endDate)",
        projects,
    )


def _employee_values(user: dict) -> dict:
    """Los datos de empleado de un usuario inicial, tal como se guardan en la base de datos."""
    return {
        "role": user["role"],
        "skills": json.dumps(user["skills"], ensure_ascii=False),
        "available": int(user["available"]),
        "project_id": user["projectId"],
        "hired_at": user["hiredAt"],
    }


def _seed_users(conn: sqlite3.Connection) -> None:
    users = json.loads((SEED_DIR / "users.json").read_text(encoding="utf-8"))
    conn.executemany(
        "INSERT INTO users (id, name, username, email, phone, website, address, company, "
        "role, skills, available, project_id, hired_at) "
        "VALUES (:id, :name, :username, :email, :phone, :website, :address, :company, "
        ":role, :skills, :available, :project_id, :hired_at)",
        [
            {
                **u,
                "address": json.dumps(u.get("address")),
                "company": json.dumps(u.get("company")),
                **_employee_values(u),
            }
            for u in users
        ],
    )


def _seed_todos(conn: sqlite3.Connection) -> None:
    todos = json.loads((SEED_DIR / "todos.json").read_text(encoding="utf-8"))
    # Solo las tareas de usuarios que existen (la clave foránea lo exige): si la base de datos ya
    # existía y se había borrado algún usuario, sus tareas iniciales no se crean.
    user_ids = {row["id"] for row in conn.execute("SELECT id FROM users")}
    todos = [t for t in todos if t["userId"] in user_ids]
    now = datetime.now(timezone.utc)
    conn.executemany(
        "INSERT INTO todos (id, user_id, title, completed, created_at, priority) "
        "VALUES (:id, :user_id, :title, :completed, :created_at, :priority)",
        [
            {
                "priority": t.get("priority") or SEED_PRIORITIES[t["id"] % 3],
                "id": t["id"],
                "user_id": t["userId"],
                "title": t["title"],
                "completed": int(t["completed"]),
                # JSONPlaceholder no trae fecha: cada tarea recibe una distinta (un minuto
                # más antigua por cada id), para que "las más recientes" tenga sentido.
                "created_at": now_iso(now - timedelta(minutes=t["id"])),
            }
            for t in todos
        ],
    )


# Cada recurso: (tabla, esquema, función que carga sus datos iniciales).
# Los proyectos van antes que los usuarios: `users.project_id` es una clave foránea hacia `projects`.
RESOURCES: list[tuple[str, str, Callable[[sqlite3.Connection], None]]] = [
    ("projects", PROJECTS_SCHEMA, _seed_projects),
    ("users", USERS_SCHEMA, _seed_users),
    ("todos", TODOS_SCHEMA, _seed_todos),
]


def _migrate_todos_add_foreign_key(conn: sqlite3.Connection) -> int:
    """Esquema 0 → 2: reconstruye `todos` con la clave foránea hacia `users`.

    SQLite no permite añadir una clave foránea a una tabla existente, así que se crea la tabla
    nueva, se copian las tareas y se sustituye la antigua. Las tareas cuyo usuario ya no existe
    (huérfanas) no se copian: con la relación en cascada, habrían desaparecido al borrar su usuario.
    Conserva ids, fechas y el contador de ids (un id borrado nunca se reutiliza).
    Devuelve cuántas tareas huérfanas se eliminaron.
    """
    conn.commit()  # PRAGMA foreign_keys solo se puede cambiar fuera de una transacción
    conn.execute("PRAGMA foreign_keys = OFF")
    try:
        row = conn.execute("SELECT seq FROM sqlite_sequence WHERE name = 'todos'").fetchone()
        last_id = row["seq"] if row else 0
        before = conn.execute("SELECT COUNT(*) FROM todos").fetchone()[0]
        conn.executescript(
            f"""
            BEGIN;
            CREATE TABLE todos_new ({TODOS_COLUMNS});
            INSERT INTO todos_new (id, user_id, title, completed, created_at)
                SELECT id, user_id, title, completed, created_at FROM todos
                WHERE user_id IN (SELECT id FROM users);
            DROP TABLE todos;
            ALTER TABLE todos_new RENAME TO todos;
            CREATE INDEX idx_todos_user_id ON todos (user_id);
            DELETE FROM sqlite_sequence WHERE name = 'todos';
            INSERT INTO sqlite_sequence (name, seq) VALUES ('todos', {int(last_id)});
            COMMIT;
            """
        )
        after = conn.execute("SELECT COUNT(*) FROM todos").fetchone()[0]
        if conn.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError("La migración dejó filas que incumplen una clave foránea")
        return before - after
    finally:
        conn.execute("PRAGMA foreign_keys = ON")


def _migrate_todos_add_priority(conn: sqlite3.Connection) -> bool:
    """Esquema 2 → 3: añade `todos.priority` (las tareas existentes quedan en 'medium').

    Si la tabla ya trae la columna (p. ej. la acaba de reconstruir la migración anterior con el esquema
    actual) no hace nada. Devuelve si añadió la columna.
    """
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(todos)")}
    if "priority" in columns:
        return False
    conn.execute(
        "ALTER TABLE todos ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' "
        "CHECK (priority IN ('high', 'medium', 'low'))"
    )
    return True


PLANNING_COLUMNS = {
    "description": "description TEXT",
    "start_date": "start_date TEXT",
    "end_date": "end_date TEXT",
    "tags": "tags TEXT NOT NULL DEFAULT '[]'",
}


def _migrate_todos_add_planning(conn: sqlite3.Connection) -> list[str]:
    """Esquema 3 → 4: añade `description`, `start_date`, `end_date` y `tags` a `todos`.

    Las tareas existentes quedan sin descripción ni fechas y con la lista de etiquetas vacía. Solo se añaden
    las columnas que falten (una tabla recién creada o reconstruida ya las trae). Devuelve las añadidas.
    """
    existing = {row["name"] for row in conn.execute("PRAGMA table_info(todos)")}
    added = []
    for name, definition in PLANNING_COLUMNS.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE todos ADD COLUMN {definition}")
            added.append(name)
    return added


def _migrate_users_add_employee_fields(conn: sqlite3.Connection) -> list[str]:
    """Esquema 4 → 5: añade a `users` los datos de empleado (`role`, `skills`, `available`, `project_id`, `hired_at`).

    Solo se añaden las columnas que falten. Si se añadieron, los usuarios iniciales que sigan en la base de datos
    reciben sus datos de empleado de ejemplo (rol, habilidades, disponibilidad y proyecto) y el resto queda con los
    valores por defecto (desarrollador, disponible, sin proyecto y sin habilidades); la fecha de incorporación que falte
    será la de hoy. Lo que ya hubiera en esas columnas (una base de datos que ya las trae) no se toca.
    Devuelve las columnas añadidas.
    """
    existing = {row["name"] for row in conn.execute("PRAGMA table_info(users)")}
    added = []
    for name, definition in EMPLOYEE_COLUMNS.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE users ADD COLUMN {definition}")
            added.append(name)
    if added:
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_project_id ON users (project_id)")
        seed = json.loads((SEED_DIR / "users.json").read_text(encoding="utf-8"))
        project_ids = {row["id"] for row in conn.execute("SELECT id FROM projects")}
        for user in seed:
            values = _employee_values(user)
            if values["project_id"] not in project_ids:
                values["project_id"] = None
                values["available"] = 1  # sin proyecto no puede estar ocupado
            conn.execute(
                "UPDATE users SET role = :role, skills = :skills, available = :available, project_id = :project_id, "
                "hired_at = :hired_at WHERE id = :id",
                {**values, "id": user["id"]},
            )
        conn.execute("UPDATE users SET hired_at = ? WHERE hired_at IS NULL", (datetime.now(timezone.utc).date().isoformat(),))
    return added


def init_db(db_path: Path) -> None:
    """Crea las tablas que falten, carga los datos iniciales de **cada tabla nueva** y migra el
    esquema de una base de datos anterior.

    Se decide tabla a tabla (y no por archivo) para que, al añadir un recurso, una base de datos
    ya existente lo reciba sin perder nada de lo que tenía. Y como solo se siembra al crear la
    tabla, si se borran todos los registros no "resucitan" al reiniciar.
    """
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = connect(db_path)
    try:
        existing = {
            row["name"]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        }
        for table, schema, seed in RESOURCES:
            if table not in existing:
                conn.executescript(schema)
                seed(conn)
        conn.commit()

        # Una tabla recién creada ya tiene el esquema actual; solo se migran las que existían.
        version = conn.execute("PRAGMA user_version").fetchone()[0]
        if version < SCHEMA_VERSION:
            if "todos" in existing:
                removed = _migrate_todos_add_foreign_key(conn) if version < 2 else 0
                _migrate_todos_add_priority(conn)
                _migrate_todos_add_planning(conn)
                if removed:
                    logger.warning(
                        "Migración de la base de datos: se eliminaron %d tareas huérfanas "
                        "(de usuarios que ya no existían)",
                        removed,
                    )
            if "users" in existing:
                _migrate_users_add_employee_fields(conn)
            conn.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
        conn.commit()
    finally:
        conn.close()


def get_db(request: Request) -> Iterator[sqlite3.Connection]:
    """Dependencia de FastAPI: abre una conexión por petición y la cierra al terminar.

    Debe declararse con `Depends(get_db, scope="function")` para que el commit se haga antes de
    enviar la respuesta (véase `routers/users.py`)."""
    conn = connect(request.app.state.db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
