import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")
NEW_TODO = {"userId": 1, "title": "Preparar la demo", "completed": False}


def parse(date: str) -> datetime:
    return datetime.fromisoformat(date.replace("Z", "+00:00"))


class TestList:
    def test_devuelve_las_200_tareas_iniciales(self, client: TestClient):
        r = client.get("/todos")
        assert r.status_code == 200
        assert len(r.json()) == 200
        assert r.headers["X-Total-Count"] == "200"

    def test_conserva_el_formato_de_jsonplaceholder_mas_createdat(self, client: TestClient):
        first = client.get("/todos").json()[0]
        assert first["id"] == 1
        assert first["userId"] == 1
        assert first["title"] == "delectus aut autem"
        assert first["completed"] is False  # un booleano de verdad, no 0/1
        assert ISO.match(first["createdAt"])

    def test_viene_ordenada_por_id(self, client: TestClient):
        ids = [t["id"] for t in client.get("/todos").json()]
        assert ids == sorted(ids)

    def test_las_fechas_iniciales_son_distintas_y_decrecen_con_el_id(self, client: TestClient):
        todos = client.get("/todos").json()
        dates = [parse(t["createdAt"]) for t in todos]
        assert len(set(dates)) == 200
        assert dates[0] > dates[-1]  # la tarea 1 es la más reciente
        assert dates[0] - dates[1] == timedelta(minutes=1)

    def test_filtra_por_usuario(self, client: TestClient):
        r = client.get("/todos", params={"userId": 1})
        assert len(r.json()) == 20
        assert {t["userId"] for t in r.json()} == {1}
        assert r.headers["X-Total-Count"] == "20"

    def test_filtra_por_estado(self, client: TestClient):
        done = client.get("/todos", params={"completed": True})
        pending = client.get("/todos", params={"completed": False})
        assert done.headers["X-Total-Count"] == "90"
        assert pending.headers["X-Total-Count"] == "110"
        assert all(t["completed"] for t in done.json())
        assert not any(t["completed"] for t in pending.json())

    def test_combina_filtros(self, client: TestClient):
        r = client.get("/todos", params={"userId": 1, "completed": True})
        assert all(t["userId"] == 1 and t["completed"] for t in r.json())
        assert int(r.headers["X-Total-Count"]) == len(r.json()) > 0

    def test_busca_por_titulo_sin_distinguir_mayusculas(self, client: TestClient):
        r = client.get("/todos", params={"q": "DELECTUS"})
        assert r.json() and all("delectus" in t["title"].lower() for t in r.json())

    def test_pagina_y_el_total_es_antes_de_paginar(self, client: TestClient):
        r = client.get("/todos", params={"_page": 3, "_limit": 10})
        assert [t["id"] for t in r.json()] == list(range(21, 31))
        assert r.headers["X-Total-Count"] == "200"

    def test_el_total_respeta_los_filtros_al_paginar(self, client: TestClient):
        r = client.get("/todos", params={"userId": 2, "_limit": 5})
        assert len(r.json()) == 5
        assert r.headers["X-Total-Count"] == "20"

    def test_permite_pedir_todas_de_una_vez_con_limit_200(self, client: TestClient):
        assert len(client.get("/todos", params={"_limit": 200}).json()) == 200

    def test_rechaza_parametros_invalidos(self, client: TestClient):
        assert client.get("/todos", params={"_page": 0}).status_code == 422
        assert client.get("/todos", params={"_limit": 201}).status_code == 422
        assert client.get("/todos", params={"userId": 0}).status_code == 422
        assert client.get("/todos", params={"completed": "quizas"}).status_code == 422


class TestGet:
    def test_devuelve_una_tarea(self, client: TestClient):
        assert client.get("/todos/2").json()["title"] == "quis ut nam facilis et officia qui"

    def test_404_si_no_existe(self, client: TestClient):
        assert client.get("/todos/999").status_code == 404

    def test_422_si_el_id_no_es_un_numero(self, client: TestClient):
        assert client.get("/todos/abc").status_code == 422


class TestCreate:
    def test_crea_con_id_y_fecha_asignados_por_el_servidor(self, client: TestClient):
        r = client.post("/todos", json=NEW_TODO)
        assert r.status_code == 201
        todo = r.json()
        assert todo["id"] == 201
        assert todo["title"] == "Preparar la demo"
        assert todo["completed"] is False
        assert ISO.match(todo["createdAt"])
        assert abs(datetime.now(timezone.utc) - parse(todo["createdAt"])) < timedelta(minutes=1)
        assert client.get("/todos/201").json() == todo
        assert client.get("/todos").headers["X-Total-Count"] == "201"

    def test_completed_es_falso_por_defecto(self, client: TestClient):
        assert client.post("/todos", json={"userId": 2, "title": "Sin estado"}).json()["completed"] is False

    def test_quita_espacios_del_titulo(self, client: TestClient):
        assert client.post("/todos", json={**NEW_TODO, "title": "  Con espacios  "}).json()["title"] == "Con espacios"

    def test_valida_el_titulo(self, client: TestClient):
        for title in ["", "  ", "ab", "x" * 121]:
            assert client.post("/todos", json={**NEW_TODO, "title": title}).status_code == 422, title
        assert client.post("/todos", json={**NEW_TODO, "title": "abc"}).status_code == 201  # 3 es válido
        assert client.post("/todos", json={**NEW_TODO, "title": "x" * 120}).status_code == 201

    def test_exige_userid_y_titulo(self, client: TestClient):
        assert client.post("/todos", json={"title": "Sin usuario"}).status_code == 422
        assert client.post("/todos", json={"userId": 1}).status_code == 422
        assert client.post("/todos", json={**NEW_TODO, "userId": 0}).status_code == 422

    def test_el_usuario_debe_existir(self, client: TestClient):
        r = client.post("/todos", json={**NEW_TODO, "userId": 99})
        assert r.status_code == 422
        assert "99" in r.json()["detail"]
        assert client.get("/todos").headers["X-Total-Count"] == "200"  # no se guardó nada

    def test_un_rechazo_no_consume_ids(self, client: TestClient):
        client.post("/todos", json={**NEW_TODO, "title": ""})
        assert client.post("/todos", json=NEW_TODO).json()["id"] == 201


class TestCreateWithIdAndDate:
    """Base del "Deshacer" del Lab 10: recrear una tarea borrada tal como era."""

    def test_respeta_el_id_y_la_fecha_enviados(self, client: TestClient):
        client.delete("/todos/5")
        r = client.post(
            "/todos", json={**NEW_TODO, "id": 5, "createdAt": "2025-01-02T03:04:05.678Z"}
        )
        assert r.status_code == 201
        assert r.json()["id"] == 5
        assert r.json()["createdAt"] == "2025-01-02T03:04:05.678Z"

    def test_responde_409_si_el_id_ya_esta_en_uso_y_no_toca_la_existente(self, client: TestClient):
        original = client.get("/todos/7").json()
        r = client.post("/todos", json={**NEW_TODO, "id": 7})
        assert r.status_code == 409
        assert "7" in r.json()["detail"]
        assert client.get("/todos/7").json() == original

    def test_un_id_mayor_hace_que_los_automaticos_continuen_desde_el_(self, client: TestClient):
        assert client.post("/todos", json={**NEW_TODO, "id": 500}).json()["id"] == 500
        assert client.post("/todos", json=NEW_TODO).json()["id"] == 501

    def test_valida_id_y_fecha(self, client: TestClient):
        assert client.post("/todos", json={**NEW_TODO, "id": 0}).status_code == 422
        for bad in ["ayer", "2025-01-02", "2025-01-02T03:04:05", "2025-01-02 03:04:05Z"]:
            assert client.post("/todos", json={**NEW_TODO, "createdAt": bad}).status_code == 422, bad

    def test_flujo_completo_borrar_y_deshacer_deja_la_tarea_identica(self, client: TestClient):
        before = client.get("/todos/12").json()
        assert client.delete("/todos/12").status_code == 204
        assert client.get("/todos/12").status_code == 404

        restored = client.post("/todos", json=before)  # el cliente reenvía la tarea tal cual
        assert restored.status_code == 201
        assert restored.json() == before
        assert client.post("/todos", json=before).status_code == 409  # segundo intento: ya está


class TestReplace:
    def test_put_sustituye_la_tarea(self, client: TestClient):
        r = client.put("/todos/1", json={"userId": 2, "title": "Título nuevo", "completed": True})
        assert r.status_code == 200
        todo = client.get("/todos/1").json()
        assert (todo["userId"], todo["title"], todo["completed"]) == (2, "Título nuevo", True)

    def test_no_cambia_la_fecha_de_creacion_aunque_se_envie_otra(self, client: TestClient):
        before = client.get("/todos/3").json()["createdAt"]
        client.put(
            "/todos/3",
            json={"userId": 1, "title": "Otro título", "completed": True, "createdAt": "2000-01-01T00:00:00.000Z", "id": 999},
        )
        after = client.get("/todos/3").json()
        assert after["createdAt"] == before
        assert after["id"] == 3  # tampoco se puede cambiar el id por el cuerpo

    def test_acepta_la_tarea_completa_como_la_envia_el_lab_10(self, client: TestClient):
        task = client.get("/todos/4").json()
        r = client.put("/todos/4", json={**task, "completed": not task["completed"]})
        assert r.status_code == 200
        assert r.json()["completed"] is (not task["completed"])

    def test_404_si_no_existe(self, client: TestClient):
        assert client.put("/todos/999", json=NEW_TODO).status_code == 404

    def test_valida_titulo_y_usuario(self, client: TestClient):
        assert client.put("/todos/1", json={**NEW_TODO, "title": "ab"}).status_code == 422
        assert client.put("/todos/1", json={**NEW_TODO, "userId": 99}).status_code == 422
        assert client.get("/todos/1").json()["title"] == "delectus aut autem"


class TestPatch:
    def test_cambia_solo_lo_enviado(self, client: TestClient):
        before = client.get("/todos/1").json()
        r = client.patch("/todos/1", json={"completed": True})
        assert r.status_code == 200
        after = client.get("/todos/1").json()
        assert after["completed"] is True
        assert (after["title"], after["userId"], after["createdAt"]) == (
            before["title"], before["userId"], before["createdAt"],
        )

    def test_no_permite_nulos(self, client: TestClient):
        for body in [{"title": None}, {"userId": None}, {"completed": None}]:
            assert client.patch("/todos/1", json=body).status_code == 422, body

    def test_valida_titulo_y_usuario(self, client: TestClient):
        assert client.patch("/todos/1", json={"title": "ab"}).status_code == 422
        assert client.patch("/todos/1", json={"userId": 99}).status_code == 422
        assert client.get("/todos/1").json()["userId"] == 1

    def test_404_si_no_existe(self, client: TestClient):
        assert client.patch("/todos/999", json={"completed": True}).status_code == 404


class TestDelete:
    def test_borra_y_ya_no_existe(self, client: TestClient):
        r = client.delete("/todos/1")
        assert r.status_code == 204 and r.content == b""
        assert client.get("/todos/1").status_code == 404
        assert client.get("/todos").headers["X-Total-Count"] == "199"

    def test_borrar_dos_veces_da_404(self, client: TestClient):
        client.delete("/todos/1")
        assert client.delete("/todos/1").status_code == 404

    def test_no_reutiliza_el_id_de_una_tarea_borrada(self, client: TestClient):
        first = client.post("/todos", json=NEW_TODO).json()["id"]
        client.delete(f"/todos/{first}")
        assert client.post("/todos", json=NEW_TODO).json()["id"] == first + 1


class TestRelationWithUsers:
    """`todos.userId` es una clave foránea hacia `users` con borrado en cascada."""

    def test_borrar_un_usuario_borra_tambien_sus_tareas(self, client: TestClient):
        assert client.delete("/users/1").status_code == 204
        assert client.get("/todos", params={"userId": 1}).headers["X-Total-Count"] == "0"
        assert client.get("/todos/1").status_code == 404
        assert client.get("/todos").headers["X-Total-Count"] == "180"  # 200 - las 20 del usuario 1

    def test_el_borrado_en_cascada_no_toca_las_tareas_de_otros_usuarios(self, client: TestClient):
        before = client.get("/todos", params={"userId": 2}).json()
        client.delete("/users/1")
        assert client.get("/todos", params={"userId": 2}).json() == before

    def test_borrar_un_usuario_sin_tareas_no_afecta_a_ninguna(self, client: TestClient):
        new_user = client.post("/users", json={"name": "Sin tareas", "email": "st@x.com"}).json()
        client.delete(f"/users/{new_user['id']}")
        assert client.get("/todos").headers["X-Total-Count"] == "200"

    def test_restaurar_un_usuario_no_restaura_sus_tareas(self, client: TestClient):
        user = client.get("/users/1").json()
        client.delete("/users/1")
        client.post("/users", json=user)  # el usuario vuelve con su mismo id...
        assert client.get("/todos", params={"userId": 1}).headers["X-Total-Count"] == "0"  # ...sin tareas

    def test_no_se_puede_crear_una_tarea_para_un_usuario_borrado(self, client: TestClient):
        client.delete("/users/1")
        assert client.post("/todos", json=NEW_TODO).status_code == 422

    def test_no_se_puede_mover_una_tarea_a_un_usuario_inexistente(self, client: TestClient):
        assert client.patch("/todos/1", json={"userId": 99}).status_code == 422
        assert client.put("/todos/1", json={**NEW_TODO, "userId": 99}).status_code == 422
        assert client.get("/todos/1").json()["userId"] == 1

    def test_una_tarea_se_puede_mover_a_otro_usuario_existente(self, client: TestClient):
        assert client.patch("/todos/1", json={"userId": 2}).json()["userId"] == 2
        client.delete("/users/2")  # ahora pertenece al usuario 2, así que se va con él
        assert client.get("/todos/1").status_code == 404

    def test_la_base_de_datos_misma_rechaza_una_tarea_sin_usuario(self, db_path: Path):
        """La integridad no depende solo de la comprobación de la API: la impone SQLite."""
        import sqlite3

        import pytest

        from app.db import connect, init_db

        init_db(db_path)
        conn = connect(db_path)
        try:
            with pytest.raises(sqlite3.IntegrityError):
                conn.execute(
                    "INSERT INTO todos (user_id, title, completed, created_at) "
                    "VALUES (999, 'Huérfana', 0, '2026-01-01T00:00:00.000Z')"
                )
        finally:
            conn.close()

    def test_el_borrado_en_cascada_se_conserva_tras_reiniciar(self, db_path: Path):
        TestClient(create_app(db_path)).delete("/users/3")
        restarted = TestClient(create_app(db_path))
        assert restarted.get("/todos").headers["X-Total-Count"] == "180"
        assert restarted.get("/todos", params={"userId": 3}).json() == []


class TestPersistence:
    def test_los_cambios_sobreviven_a_un_reinicio_del_servidor(self, db_path: Path):
        first_run = TestClient(create_app(db_path))
        created = first_run.post("/todos", json=NEW_TODO).json()
        first_run.patch("/todos/2", json={"completed": True})
        first_run.delete("/todos/3")

        restarted = TestClient(create_app(db_path))
        todos = {t["id"]: t for t in restarted.get("/todos").json()}
        assert todos[created["id"]] == created  # incluida su fecha de creación
        assert todos[2]["completed"] is True
        assert 3 not in todos


class TestCors:
    def test_permite_la_app_y_el_preflight_de_las_escrituras(self, client: TestClient):
        assert client.get("/todos", headers={"Origin": "http://localhost:4210"}).headers[
            "access-control-allow-origin"
        ] == "http://localhost:4210"
        for method in ["POST", "PUT", "PATCH", "DELETE"]:
            r = client.options(
                "/todos/1",
                headers={
                    "Origin": "http://localhost:4210",
                    "Access-Control-Request-Method": method,
                    "Access-Control-Request-Headers": "content-type",
                },
            )
            assert r.status_code == 200, method
