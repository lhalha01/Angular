"""Prioridad de las tareas (`priority`: 'high' | 'medium' | 'low', por defecto 'medium'). Esquema v3 (la columna sigue en el v4)."""

import json
import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import SEED_DIR
from app.db import SCHEMA_VERSION, USERS_SCHEMA, init_db
from app.main import create_app

NEW_TODO = {"userId": 1, "title": "Preparar la demo", "completed": False}
PRIORITIES = {"high", "medium", "low"}


class TestDatosIniciales:
    def test_todas_las_tareas_tienen_prioridad_valida(self, client: TestClient):
        todos = client.get("/todos").json()
        assert {t["priority"] for t in todos} == PRIORITIES

    def test_la_prioridad_inicial_se_reparte_segun_el_id(self, client: TestClient):
        by_id = {t["id"]: t["priority"] for t in client.get("/todos").json()}
        assert (by_id[1], by_id[2], by_id[3], by_id[4]) == ("medium", "low", "high", "medium")

    def test_hay_de_las_tres_en_cantidades_parecidas(self, client: TestClient):
        for priority in PRIORITIES:
            total = int(client.get("/todos", params={"priority": priority}).headers["X-Total-Count"])
            assert 60 <= total <= 70

    def test_la_semilla_declara_la_prioridad_de_cada_tarea(self):
        seed = json.loads((SEED_DIR / "todos.json").read_text(encoding="utf-8"))
        assert len(seed) == 200
        assert all(t["priority"] in PRIORITIES for t in seed)


class TestFiltro:
    def test_filtra_por_prioridad_y_cuenta_el_total(self, client: TestClient):
        r = client.get("/todos", params={"priority": "high"})
        assert r.status_code == 200
        todos = r.json()
        assert todos and all(t["priority"] == "high" for t in todos)
        assert r.headers["X-Total-Count"] == str(len(todos))

    def test_se_combina_con_los_demas_filtros(self, client: TestClient):
        r = client.get("/todos", params={"priority": "low", "completed": "true", "userId": 1, "q": "a"})
        todos = r.json()
        assert all(t["priority"] == "low" and t["completed"] and t["userId"] == 1 for t in todos)
        assert all("a" in t["title"].lower() for t in todos)

    def test_se_combina_con_la_paginacion(self, client: TestClient):
        r = client.get("/todos", params={"priority": "medium", "_limit": 5, "_page": 2})
        assert len(r.json()) == 5
        assert int(r.headers["X-Total-Count"]) > 5  # el total es el filtrado, no el de la página

    def test_una_prioridad_desconocida_es_un_422(self, client: TestClient):
        assert client.get("/todos", params={"priority": "urgente"}).status_code == 422


class TestCrear:
    def test_sin_prioridad_queda_en_media(self, client: TestClient):
        created = client.post("/todos", json=NEW_TODO).json()
        assert created["priority"] == "medium"
        assert client.get(f"/todos/{created['id']}").json()["priority"] == "medium"

    def test_con_prioridad_se_guarda(self, client: TestClient):
        created = client.post("/todos", json={**NEW_TODO, "priority": "high"}).json()
        assert created["priority"] == "high"

    def test_una_prioridad_invalida_se_rechaza(self, client: TestClient):
        for invalid in ("urgente", "", None, 3):
            r = client.post("/todos", json={**NEW_TODO, "priority": invalid})
            assert r.status_code == 422, invalid

    def test_restaurar_una_tarea_conserva_su_prioridad(self, client: TestClient):
        original = client.post("/todos", json={**NEW_TODO, "priority": "low"}).json()
        client.delete(f"/todos/{original['id']}")
        restored = client.post("/todos", json=original)  # el cuerpo de "Deshacer": id, fecha y prioridad
        assert restored.status_code == 201
        assert restored.json() == original


class TestSustituir:
    def test_put_con_prioridad_la_cambia(self, client: TestClient):
        todo = client.post("/todos", json=NEW_TODO).json()
        r = client.put(f"/todos/{todo['id']}", json={**NEW_TODO, "priority": "high"})
        assert r.json()["priority"] == "high"

    def test_put_sin_prioridad_conserva_la_actual(self, client: TestClient):
        """Un cliente anterior a este campo (el Lab 10 de 1-Basico) no debe reiniciarla al guardar."""
        todo = client.post("/todos", json={**NEW_TODO, "priority": "low"}).json()
        r = client.put(f"/todos/{todo['id']}", json={"userId": 1, "title": "Título nuevo", "completed": True})
        assert r.status_code == 200
        assert r.json()["priority"] == "low"
        assert r.json()["title"] == "Título nuevo"

    def test_put_con_prioridad_invalida_se_rechaza(self, client: TestClient):
        todo = client.post("/todos", json=NEW_TODO).json()
        r = client.put(f"/todos/{todo['id']}", json={**NEW_TODO, "priority": "urgente"})
        assert r.status_code == 422


class TestPatch:
    def test_cambia_solo_la_prioridad(self, client: TestClient):
        todo = client.post("/todos", json=NEW_TODO).json()
        r = client.patch(f"/todos/{todo['id']}", json={"priority": "high"})
        assert r.status_code == 200
        assert r.json() == {**todo, "priority": "high"}

    def test_otros_cambios_no_tocan_la_prioridad(self, client: TestClient):
        todo = client.post("/todos", json={**NEW_TODO, "priority": "low"}).json()
        r = client.patch(f"/todos/{todo['id']}", json={"completed": True})
        assert r.json()["priority"] == "low"

    def test_no_admite_nulo_ni_valores_invalidos(self, client: TestClient):
        todo = client.post("/todos", json=NEW_TODO).json()
        assert client.patch(f"/todos/{todo['id']}", json={"priority": None}).status_code == 422
        assert client.patch(f"/todos/{todo['id']}", json={"priority": "urgente"}).status_code == 422


def make_v2_db(db_path: Path) -> None:
    """Base de datos del esquema 2: con la clave foránea pero sin `priority`."""
    conn = sqlite3.connect(db_path)
    conn.executescript(
        USERS_SCHEMA
        + """
        CREATE TABLE todos (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
            title      TEXT NOT NULL,
            completed  INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE INDEX idx_todos_user_id ON todos (user_id);
        """
    )
    conn.execute("INSERT INTO users (id, name, email) VALUES (1, 'Uno', 'uno@x.com')")
    conn.executemany(
        "INSERT INTO todos (id, user_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)",
        [(1, 1, "Primera", 0, "2026-01-01T00:00:01.000Z"), (2, 1, "Segunda", 1, "2026-01-01T00:00:02.000Z")],
    )
    conn.execute("PRAGMA user_version = 2")
    conn.commit()
    conn.close()


class TestMigracion:
    def test_de_la_version_2_a_la_3_anade_la_columna_con_valor_medio(self, db_path: Path):
        make_v2_db(db_path)
        client = TestClient(create_app(db_path))
        todos = client.get("/todos").json()
        assert [(t["id"], t["title"], t["completed"], t["priority"]) for t in todos] == [
            (1, "Primera", False, "medium"),
            (2, "Segunda", True, "medium"),
        ]
        assert todos[0]["createdAt"] == "2026-01-01T00:00:01.000Z"  # la fecha original, sin tocar

    def test_la_migracion_marca_la_version_y_no_se_repite(self, db_path: Path):
        make_v2_db(db_path)
        init_db(db_path)
        conn = sqlite3.connect(db_path)
        assert conn.execute("PRAGMA user_version").fetchone()[0] == SCHEMA_VERSION
        conn.close()
        client = TestClient(create_app(db_path))
        client.patch("/todos/1", json={"priority": "high"})
        init_db(db_path)  # arrancar otra vez no debe volver a tocar nada
        assert TestClient(create_app(db_path)).get("/todos/1").json()["priority"] == "high"

    def test_tras_migrar_la_columna_valida_y_funciona_el_filtro(self, db_path: Path):
        make_v2_db(db_path)
        client = TestClient(create_app(db_path))
        assert client.patch("/todos/2", json={"priority": "low"}).json()["priority"] == "low"
        assert [t["id"] for t in client.get("/todos", params={"priority": "low"}).json()] == [2]
        conn = sqlite3.connect(db_path)
        try:
            conn.execute("UPDATE todos SET priority = 'urgente' WHERE id = 1")  # la restricción CHECK lo impide
            raise AssertionError("la base de datos aceptó una prioridad inválida")
        except sqlite3.IntegrityError:
            pass
        finally:
            conn.close()

    def test_las_tareas_iniciales_de_una_tabla_recien_creada_reciben_prioridad(self, db_path: Path):
        client = TestClient(create_app(db_path))
        assert {t["priority"] for t in client.get("/todos").json()} == PRIORITIES
