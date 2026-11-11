"""Creación de la base de datos y migración de una ya existente."""

import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from app.db import init_db
from app.main import create_app


def tables(db_path: Path) -> set[str]:
    conn = sqlite3.connect(db_path)
    try:
        return {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    finally:
        conn.close()


def test_una_base_de_datos_nueva_crea_y_siembra_todos_los_recursos(db_path: Path):
    init_db(db_path)
    assert {"users", "todos"} <= tables(db_path)
    client = TestClient(create_app(db_path))
    assert client.get("/users").headers["X-Total-Count"] == "10"
    assert client.get("/todos").headers["X-Total-Count"] == "200"


def test_una_base_de_datos_anterior_recibe_el_recurso_nuevo_sin_perder_nada(db_path: Path):
    """Caso real: la base de datos del Lab 10.1 solo tenía `users`, y luego se añadió `/todos`."""
    first = TestClient(create_app(db_path))
    first.patch("/users/1", json={"name": "Editado por el usuario"})
    first.delete("/users/2")

    conn = sqlite3.connect(db_path)
    conn.execute("DROP TABLE todos")  # simula la base de datos de antes de existir /todos
    conn.commit()
    conn.close()
    assert "todos" not in tables(db_path)

    upgraded = TestClient(create_app(db_path))
    # Tabla nueva, sembrada: sin las 20 tareas del usuario 2, que ya no existe (clave foránea).
    assert upgraded.get("/todos").headers["X-Total-Count"] == "180"
    assert upgraded.get("/todos", params={"userId": 2}).json() == []
    assert upgraded.get("/users/1").json()["name"] == "Editado por el usuario"  # intacto
    assert upgraded.get("/users/2").status_code == 404  # lo borrado sigue borrado
    assert upgraded.get("/users").headers["X-Total-Count"] == "9"


def test_arrancar_varias_veces_no_vuelve_a_sembrar(db_path: Path):
    first = TestClient(create_app(db_path))
    first.delete("/todos/1")
    for _ in range(3):
        again = TestClient(create_app(db_path))
    assert again.get("/todos").headers["X-Total-Count"] == "199"


def test_si_se_borran_todos_los_registros_no_resucitan_al_reiniciar(db_path: Path):
    client = TestClient(create_app(db_path))
    for todo_id in range(1, 201):
        client.delete(f"/todos/{todo_id}")
    assert TestClient(create_app(db_path)).get("/todos").json() == []


# --- Migración del esquema 0 (sin clave foránea) al 2 (con clave foránea en cascada) -----------

OLD_TODOS_SCHEMA = """
CREATE TABLE todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    title      TEXT NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_todos_user_id ON todos (user_id);
"""


def make_legacy_db(db_path: Path) -> None:
    """Base de datos como la dejaba la versión anterior: sin clave foránea ni `user_version`.
    Tiene los usuarios 2 y 3, tareas suyas y tres huérfanas (del usuario 1, ya borrado, y del 99)."""
    from app.db import USERS_SCHEMA

    conn = sqlite3.connect(db_path)
    conn.executescript(USERS_SCHEMA + OLD_TODOS_SCHEMA)
    conn.executemany(
        "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
        [(2, "Dos", "dos@x.com"), (3, "Tres", "tres@x.com")],
    )
    conn.executemany(
        "INSERT INTO todos (id, user_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)",
        [
            (1, 1, "Huérfana del usuario 1", 0, "2026-01-01T00:00:01.000Z"),
            (2, 2, "Tarea del usuario 2", 1, "2026-01-01T00:00:02.000Z"),
            (3, 3, "Tarea del usuario 3", 0, "2026-01-01T00:00:03.000Z"),
            (9, 99, "Huérfana del usuario 99", 0, "2026-01-01T00:00:09.000Z"),
        ],
    )
    conn.commit()
    conn.close()


def test_la_migracion_elimina_las_huerfanas_y_conserva_el_resto_intacto(db_path: Path):
    make_legacy_db(db_path)
    client = TestClient(create_app(db_path))

    todos = client.get("/todos").json()
    assert [t["id"] for t in todos] == [2, 3]  # las huérfanas (1 y 9) ya no están
    assert todos[0] == {
        "id": 2,
        "userId": 2,
        "title": "Tarea del usuario 2",
        "completed": True,
        "createdAt": "2026-01-01T00:00:02.000Z",  # la fecha original, sin tocar
        "priority": "medium",  # la migración añade la columna con su valor por defecto
        "description": None,  # y las de planificación, vacías
        "startDate": None,
        "endDate": None,
        "tags": [],
    }
    assert client.get("/users").headers["X-Total-Count"] == "2"  # los usuarios, intactos


def test_la_migracion_no_reutiliza_ids(db_path: Path):
    """El id 9 (de una huérfana eliminada) era el mayor: el siguiente debe ser el 10, no el 4."""
    make_legacy_db(db_path)
    client = TestClient(create_app(db_path))
    created = client.post("/todos", json={"userId": 2, "title": "Nueva tras migrar"}).json()
    assert created["id"] == 10


def test_tras_migrar_la_relacion_esta_activa(db_path: Path):
    make_legacy_db(db_path)
    client = TestClient(create_app(db_path))
    assert client.post("/todos", json={"userId": 99, "title": "Usuario inexistente"}).status_code == 422
    client.delete("/users/2")  # borrado en cascada sobre la tabla ya migrada
    assert [t["id"] for t in client.get("/todos").json()] == [3]


def test_la_migracion_marca_la_version_y_no_se_repite(db_path: Path):
    from app.db import SCHEMA_VERSION

    make_legacy_db(db_path)
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    assert conn.execute("PRAGMA user_version").fetchone()[0] == SCHEMA_VERSION
    conn.close()

    client = TestClient(create_app(db_path))
    client.post("/todos", json={"userId": 3, "title": "Una más"})
    ids_before = [t["id"] for t in client.get("/todos").json()]
    init_db(db_path)  # arrancar otra vez no debe volver a tocar nada
    init_db(db_path)
    assert [t["id"] for t in TestClient(create_app(db_path)).get("/todos").json()] == ids_before


def test_se_registra_cuantas_huerfanas_se_eliminaron(db_path: Path, caplog):
    import logging

    make_legacy_db(db_path)
    with caplog.at_level(logging.WARNING, logger="uvicorn.error"):
        init_db(db_path)
    assert any("2 tareas huérfanas" in r.getMessage() for r in caplog.records)


def test_una_base_de_datos_sin_huerfanas_se_migra_sin_perder_ninguna_tarea(db_path: Path):
    first = TestClient(create_app(db_path))
    total = first.get("/todos").headers["X-Total-Count"]
    # Simula una base de datos anterior: misma información pero sin versión de esquema.
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA user_version = 0")
    conn.commit()
    conn.close()
    assert TestClient(create_app(db_path)).get("/todos").headers["X-Total-Count"] == total
