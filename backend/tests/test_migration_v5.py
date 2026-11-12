"""Migración del esquema 4 al 5: tabla `projects` y datos de empleado en `users`."""

import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from app.db import PROJECTS_SCHEMA, SCHEMA_VERSION, USERS_SCHEMA_V4, init_db
from app.main import create_app

TODOS_V4 = """
CREATE TABLE todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    description TEXT,
    start_date TEXT,
    end_date   TEXT,
    tags       TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX idx_todos_user_id ON todos (user_id);
"""


def make_v4_db(db_path: Path, *, extra_users: tuple[tuple[int, str, str], ...] = ()) -> None:
    """Una base de datos del esquema 4: usuarios sin datos de empleado, tareas y sin tabla `projects`."""
    conn = sqlite3.connect(db_path)
    conn.executescript(USERS_SCHEMA_V4 + TODOS_V4)
    conn.execute("INSERT INTO users (id, name, email) VALUES (1, 'Uno', 'uno@x.com')")
    conn.execute("INSERT INTO users (id, name, email) VALUES (2, 'Dos', 'dos@x.com')")
    conn.executemany("INSERT INTO users (id, name, email) VALUES (?, ?, ?)", extra_users)
    conn.execute("INSERT INTO todos (id, user_id, title, completed, created_at) VALUES (1, 1, 'Primera', 0, '2026-01-01T00:00:01.000Z')")
    conn.execute("PRAGMA user_version = 4")
    conn.commit()
    conn.close()


def version(db_path: Path) -> int:
    conn = sqlite3.connect(db_path)
    try:
        return conn.execute("PRAGMA user_version").fetchone()[0]
    finally:
        conn.close()


class TestMigracion:
    def test_crea_y_siembra_los_proyectos(self, db_path: Path):
        make_v4_db(db_path)
        client = TestClient(create_app(db_path))
        assert client.get("/projects").headers["X-Total-Count"] == "20"

    def test_los_usuarios_iniciales_reciben_sus_datos_de_empleado(self, db_path: Path):
        make_v4_db(db_path)
        users = {u["id"]: u for u in TestClient(create_app(db_path)).get("/users").json()}
        assert (users[1]["role"], users[1]["available"], users[1]["projectId"]) == ("desarrollador", False, 8)
        assert (users[2]["role"], users[2]["available"], users[2]["projectId"]) == ("diseñador", True, None)
        assert len(users[1]["skills"]) == 3

    def test_un_usuario_que_no_es_inicial_queda_con_los_valores_por_defecto(self, db_path: Path):
        make_v4_db(db_path, extra_users=((50, "Nuevo", "nuevo@x.com"),))
        user = TestClient(create_app(db_path)).get("/users/50").json()
        assert (user["role"], user["skills"], user["available"], user["projectId"]) == ("desarrollador", [], True, None)
        assert len(user["hiredAt"]) == 10  # hoy

    def test_no_pierde_nada_de_lo_que_habia(self, db_path: Path):
        make_v4_db(db_path)
        client = TestClient(create_app(db_path))
        assert client.get("/users/1").json()["name"] == "Uno"
        assert [t["title"] for t in client.get("/todos").json()] == ["Primera"]

    def test_marca_la_version_y_no_se_repite(self, db_path: Path):
        make_v4_db(db_path)
        init_db(db_path)
        assert version(db_path) == SCHEMA_VERSION == 5
        # lo que el usuario cambie después no se pisa al reiniciar
        client = TestClient(create_app(db_path))
        client.patch("/users/2", json={"role": "manager"})
        client.patch("/projects/1", json={"name": "Nombre propio"})
        again = TestClient(create_app(db_path))
        assert again.get("/users/2").json()["role"] == "manager"
        assert again.get("/projects/1").json()["name"] == "Nombre propio"

    def test_tras_migrar_se_puede_escribir(self, db_path: Path):
        make_v4_db(db_path)
        client = TestClient(create_app(db_path))
        r = client.put("/users/2", json={"name": "Dos", "email": "dos@x.com", "available": False, "projectId": 3})
        assert r.status_code == 200
        assert 2 in client.get("/projects/3").json()["memberIds"]

    def test_se_mantienen_las_claves_foraneas(self, db_path: Path):
        make_v4_db(db_path)
        client = TestClient(create_app(db_path))
        client.delete("/projects/8")  # el usuario 1 estaba en el 8
        assert client.get("/users/1").json()["projectId"] is None
        client.delete("/users/1")
        assert client.get("/todos").json() == []  # el borrado en cascada de las tareas sigue funcionando

    def test_una_base_que_ya_tiene_los_proyectos_no_los_vuelve_a_sembrar(self, db_path: Path):
        make_v4_db(db_path)
        conn = sqlite3.connect(db_path)
        conn.executescript(PROJECTS_SCHEMA)
        conn.execute("INSERT INTO projects (id, name, client, start_date) VALUES (1, 'Único', 'Acme', '2026-01-01')")
        conn.commit()
        conn.close()
        client = TestClient(create_app(db_path))
        assert [p["name"] for p in client.get("/projects").json()] == ["Único"]
        # el usuario 1 estaba en el proyecto 8, que no existe: se queda sin proyecto y disponible (nunca ocupado sin proyecto)
        user = client.get("/users/1").json()
        assert (user["projectId"], user["available"]) == (None, True)

    def test_desde_una_version_anterior_llega_hasta_la_actual(self, db_path: Path):
        from tests.test_db import make_legacy_db

        make_legacy_db(db_path)  # esquema 0
        client = TestClient(create_app(db_path))
        assert version(db_path) == SCHEMA_VERSION
        assert client.get("/projects").headers["X-Total-Count"] == "20"
        assert all(u["role"] for u in client.get("/users").json())


class TestRestriccionesDeLaBaseDeDatos:
    def test_el_rol_y_el_estado_solo_admiten_los_valores_del_dominio(self, db_path: Path):
        TestClient(create_app(db_path))
        conn = sqlite3.connect(db_path)
        try:
            for sql in (
                "UPDATE users SET role = 'jefe' WHERE id = 1",
                "UPDATE projects SET status = 'activo' WHERE id = 1",
                "UPDATE users SET available = 2 WHERE id = 1",
            ):
                try:
                    conn.execute(sql)
                    raise AssertionError(f"la base de datos aceptó: {sql}")
                except sqlite3.IntegrityError:
                    pass
        finally:
            conn.close()
