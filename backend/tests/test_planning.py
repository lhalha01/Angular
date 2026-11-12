"""Planificación de las tareas: `description`, `startDate`, `endDate` y `tags`. Esquema v4."""

import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from app.db import SCHEMA_VERSION, USERS_SCHEMA_V4, init_db
from app.main import create_app

NEW_TODO = {"userId": 1, "title": "Preparar la demo", "completed": False}
FULL = {
    **NEW_TODO,
    "description": "Revisar las diapositivas y ensayar",
    "startDate": "2026-03-01",
    "endDate": "2026-03-05",
    "tags": ["demo", "urgente"],
}
EMPTY_PLANNING = {"description": None, "startDate": None, "endDate": None, "tags": []}


def create(client: TestClient, **extra):
    r = client.post("/todos", json={**NEW_TODO, **extra})
    assert r.status_code == 201, r.text
    return r.json()


class TestValoresPorDefecto:
    def test_las_tareas_iniciales_no_tienen_planificacion(self, client: TestClient):
        for todo in client.get("/todos").json()[:5]:
            assert {k: todo[k] for k in EMPTY_PLANNING} == EMPTY_PLANNING

    def test_una_tarea_nueva_sin_esos_campos_los_deja_vacios(self, client: TestClient):
        created = create(client)
        assert {k: created[k] for k in EMPTY_PLANNING} == EMPTY_PLANNING


class TestCrear:
    def test_guarda_y_devuelve_los_cuatro_campos(self, client: TestClient):
        created = create(client, **{k: FULL[k] for k in EMPTY_PLANNING})
        assert created["description"] == "Revisar las diapositivas y ensayar"
        assert (created["startDate"], created["endDate"]) == ("2026-03-01", "2026-03-05")
        assert created["tags"] == ["demo", "urgente"]
        assert client.get(f"/todos/{created['id']}").json() == created  # sobreviven a la lectura

    def test_el_orden_de_las_etiquetas_se_conserva_y_admiten_tildes(self, client: TestClient):
        created = create(client, tags=["ñandú", "áéí", "zeta", "alfa"])
        assert created["tags"] == ["ñandú", "áéí", "zeta", "alfa"]

    def test_recorta_la_descripcion_y_una_vacia_es_ninguna(self, client: TestClient):
        assert create(client, description="  hola  ")["description"] == "hola"
        assert create(client, description="   ")["description"] is None
        assert create(client, description="")["description"] is None

    def test_recorta_las_etiquetas(self, client: TestClient):
        assert create(client, tags=["  demo  "])["tags"] == ["demo"]

    def test_las_fechas_pueden_ser_iguales_o_estar_solas(self, client: TestClient):
        assert create(client, startDate="2026-03-01", endDate="2026-03-01")["endDate"] == "2026-03-01"
        assert create(client, startDate="2026-03-01")["endDate"] is None
        assert create(client, endDate="2026-03-01")["startDate"] is None

    def test_restaurar_una_tarea_conserva_su_planificacion(self, client: TestClient):
        original = create(client, **{k: FULL[k] for k in EMPTY_PLANNING}, priority="high")
        client.delete(f"/todos/{original['id']}")
        restored = client.post("/todos", json=original)
        assert restored.status_code == 201
        assert restored.json() == original


class TestValidacion:
    def post(self, client: TestClient, **extra):
        return client.post("/todos", json={**NEW_TODO, **extra})

    def test_la_fecha_de_fin_no_puede_ser_anterior_a_la_de_inicio(self, client: TestClient):
        r = self.post(client, startDate="2026-03-05", endDate="2026-03-01")
        assert r.status_code == 422
        assert "anterior" in r.text

    def test_formato_de_fecha_invalido(self, client: TestClient):
        for invalid in ("01/03/2026", "2026-3-1", "mañana", "2026-03-01T10:00:00Z", 20260301):
            assert self.post(client, startDate=invalid).status_code == 422, invalid

    def test_la_fecha_debe_existir_de_verdad(self, client: TestClient):
        assert self.post(client, startDate="2026-02-30").status_code == 422
        assert self.post(client, endDate="2026-13-01").status_code == 422
        assert self.post(client, startDate="2028-02-29").status_code == 201  # bisiesto

    def test_la_descripcion_admite_500_caracteres_y_no_501(self, client: TestClient):
        assert self.post(client, description="x" * 500).status_code == 201
        assert self.post(client, description="x" * 501).status_code == 422

    def test_etiquetas_validas_e_invalidas(self, client: TestClient):
        assert self.post(client, tags=["x" * 20]).status_code == 201
        assert self.post(client, tags=["x" * 21]).status_code == 422
        assert self.post(client, tags=[""]).status_code == 422
        assert self.post(client, tags=["   "]).status_code == 422
        assert self.post(client, tags=[5]).status_code == 422
        assert self.post(client, tags="demo").status_code == 422
        assert self.post(client, tags=None).status_code == 422

    def test_como_mucho_20_etiquetas(self, client: TestClient):
        assert self.post(client, tags=[f"t{i}" for i in range(20)]).status_code == 201
        assert self.post(client, tags=[f"t{i}" for i in range(21)]).status_code == 422


class TestSustituir:
    def test_put_con_los_campos_los_cambia(self, client: TestClient):
        todo = create(client)
        r = client.put(f"/todos/{todo['id']}", json=FULL)
        assert r.status_code == 200
        assert (r.json()["description"], r.json()["tags"], r.json()["startDate"]) == (FULL["description"], FULL["tags"], FULL["startDate"])

    def test_put_sin_los_campos_los_conserva(self, client: TestClient):
        """Un cliente anterior a estos campos (el Lab 10 de 1-Basico) no debe borrarlos al guardar."""
        todo = create(client, **{k: FULL[k] for k in EMPTY_PLANNING})
        r = client.put(f"/todos/{todo['id']}", json={"userId": 1, "title": "Título nuevo", "completed": True})
        body = r.json()
        assert r.status_code == 200
        assert body["title"] == "Título nuevo"
        assert {k: body[k] for k in EMPTY_PLANNING} == {k: FULL[k] for k in EMPTY_PLANNING}

    def test_put_con_valores_vacios_los_borra(self, client: TestClient):
        todo = create(client, **{k: FULL[k] for k in EMPTY_PLANNING})
        r = client.put(
            f"/todos/{todo['id']}",
            json={**NEW_TODO, "description": None, "startDate": None, "endDate": None, "tags": []},
        )
        assert {k: r.json()[k] for k in EMPTY_PLANNING} == EMPTY_PLANNING

    def test_put_valida_el_orden_de_las_fechas_incluso_contra_una_fecha_conservada(self, client: TestClient):
        todo = create(client, startDate="2026-03-10")
        r = client.put(f"/todos/{todo['id']}", json={**NEW_TODO, "endDate": "2026-03-01"})  # el inicio se conserva
        assert r.status_code == 422
        assert client.get(f"/todos/{todo['id']}").json()["endDate"] is None  # no se guardó nada


class TestPatch:
    def test_cambia_solo_lo_enviado(self, client: TestClient):
        todo = create(client, **{k: FULL[k] for k in EMPTY_PLANNING})
        r = client.patch(f"/todos/{todo['id']}", json={"tags": ["nueva"]})
        assert r.json() == {**todo, "tags": ["nueva"]}

    def test_null_borra_la_descripcion_y_las_fechas(self, client: TestClient):
        todo = create(client, **{k: FULL[k] for k in EMPTY_PLANNING})
        r = client.patch(f"/todos/{todo['id']}", json={"description": None, "startDate": None, "endDate": None})
        assert (r.json()["description"], r.json()["startDate"], r.json()["endDate"]) == (None, None, None)
        assert r.json()["tags"] == FULL["tags"]  # las etiquetas no se tocan

    def test_las_etiquetas_no_admiten_null_pero_si_la_lista_vacia(self, client: TestClient):
        todo = create(client, tags=["a"])
        assert client.patch(f"/todos/{todo['id']}", json={"tags": None}).status_code == 422
        assert client.patch(f"/todos/{todo['id']}", json={"tags": []}).json()["tags"] == []

    def test_valida_el_orden_de_las_fechas_contra_la_tarea_guardada(self, client: TestClient):
        todo = create(client, startDate="2026-03-10", endDate="2026-03-20")
        assert client.patch(f"/todos/{todo['id']}", json={"endDate": "2026-03-01"}).status_code == 422
        assert client.patch(f"/todos/{todo['id']}", json={"startDate": "2026-04-01"}).status_code == 422
        assert client.patch(f"/todos/{todo['id']}", json={"startDate": "2026-03-15"}).status_code == 200

    def test_valida_formato_longitud_y_etiquetas(self, client: TestClient):
        todo = create(client)
        url = f"/todos/{todo['id']}"
        assert client.patch(url, json={"startDate": "ayer"}).status_code == 422
        assert client.patch(url, json={"description": "x" * 501}).status_code == 422
        assert client.patch(url, json={"tags": ["x" * 21]}).status_code == 422


def make_v3_db(db_path: Path) -> None:
    """Base de datos del esquema 3: con prioridad pero sin los campos de planificación."""
    conn = sqlite3.connect(db_path)
    conn.executescript(
        USERS_SCHEMA_V4
        + """
        CREATE TABLE todos (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
            title      TEXT NOT NULL,
            completed  INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'))
        );
        CREATE INDEX idx_todos_user_id ON todos (user_id);
        """
    )
    conn.execute("INSERT INTO users (id, name, email) VALUES (1, 'Uno', 'uno@x.com')")
    conn.executemany(
        "INSERT INTO todos (id, user_id, title, completed, created_at, priority) VALUES (?, ?, ?, ?, ?, ?)",
        [(1, 1, "Primera", 0, "2026-01-01T00:00:01.000Z", "high"), (2, 1, "Segunda", 1, "2026-01-01T00:00:02.000Z", "low")],
    )
    conn.execute("PRAGMA user_version = 3")
    conn.commit()
    conn.close()


class TestMigracion:
    def test_de_la_version_3_a_la_4_anade_las_columnas_sin_perder_nada(self, db_path: Path):
        make_v3_db(db_path)
        todos = TestClient(create_app(db_path)).get("/todos").json()
        assert [(t["id"], t["title"], t["priority"]) for t in todos] == [(1, "Primera", "high"), (2, "Segunda", "low")]
        assert all({k: t[k] for k in EMPTY_PLANNING} == EMPTY_PLANNING for t in todos)
        assert todos[0]["createdAt"] == "2026-01-01T00:00:01.000Z"

    def test_marca_la_version_y_no_se_repite(self, db_path: Path):
        make_v3_db(db_path)
        init_db(db_path)
        conn = sqlite3.connect(db_path)
        assert conn.execute("PRAGMA user_version").fetchone()[0] == SCHEMA_VERSION == 5
        conn.close()
        client = TestClient(create_app(db_path))
        client.patch("/todos/1", json={"tags": ["a"], "description": "hola"})
        init_db(db_path)
        again = TestClient(create_app(db_path)).get("/todos/1").json()
        assert (again["tags"], again["description"]) == (["a"], "hola")

    def test_tras_migrar_se_puede_escribir_la_planificacion(self, db_path: Path):
        make_v3_db(db_path)
        client = TestClient(create_app(db_path))
        r = client.put("/todos/2", json={"userId": 1, "title": "Segunda", "completed": True, **{k: FULL[k] for k in EMPTY_PLANNING}})
        assert r.status_code == 200
        assert r.json()["tags"] == FULL["tags"]
        assert r.json()["priority"] == "low"  # la prioridad conservada, no tocada

    def test_desde_una_version_anterior_llega_hasta_la_actual(self, db_path: Path):
        from tests.test_db import make_legacy_db

        make_legacy_db(db_path)  # esquema 0: sin clave foránea ni prioridad ni planificación
        client = TestClient(create_app(db_path))
        todos = client.get("/todos").json()
        assert [t["id"] for t in todos] == [2, 3]
        assert all(t["priority"] == "medium" and t["tags"] == [] and t["description"] is None for t in todos)
        conn = sqlite3.connect(db_path)
        assert conn.execute("PRAGMA user_version").fetchone()[0] == SCHEMA_VERSION
        conn.close()

    def test_la_lista_de_etiquetas_no_puede_quedar_nula_en_la_base_de_datos(self, db_path: Path):
        TestClient(create_app(db_path))  # crea la base de datos
        conn = sqlite3.connect(db_path)
        try:
            conn.execute("UPDATE todos SET tags = NULL WHERE id = 1")
            raise AssertionError("la base de datos aceptó una lista de etiquetas nula")
        except sqlite3.IntegrityError:
            pass
        finally:
            conn.close()
