"""Recurso /projects (proyectos de TalentHub). Esquema v5."""

from fastapi.testclient import TestClient

NEW_PROJECT = {"name": "Portal del cliente", "client": "Acme Corp"}


def create(client: TestClient, **extra) -> dict:
    r = client.post("/projects", json={**NEW_PROJECT, **extra})
    assert r.status_code == 201, r.text
    return r.json()


class TestDatosIniciales:
    def test_hay_20_proyectos_de_ejemplo(self, client: TestClient):
        r = client.get("/projects")
        assert len(r.json()) == 20
        assert r.headers["X-Total-Count"] == "20"

    def test_forma_de_un_proyecto(self, client: TestClient):
        project = client.get("/projects/1").json()
        assert set(project) == {"id", "name", "client", "status", "startDate", "endDate", "memberIds"}
        assert project["status"] in ("active", "paused", "completed")

    def test_estados_repartidos_y_fecha_de_fin_solo_si_estan_completados(self, client: TestClient):
        projects = client.get("/projects").json()
        assert {p["status"] for p in projects} == {"active", "paused", "completed"}
        for p in projects:
            assert (p["endDate"] is not None) == (p["status"] == "completed")
            if p["endDate"]:
                assert p["endDate"] >= p["startDate"]

    def test_los_ids_de_los_equipos_son_los_de_los_ocupados(self, client: TestClient):
        by_project = {p["id"]: p["memberIds"] for p in client.get("/projects").json()}
        assert by_project[8] == [1] and by_project[2] == [3] and by_project[5] == []
        assert sorted(i for ids in by_project.values() for i in ids) == [1, 3, 5, 7, 9]


class TestListar:
    def test_filtra_por_estado(self, client: TestClient):
        r = client.get("/projects", params={"status": "paused"})
        assert [p["id"] for p in r.json()] == [4, 12, 18]
        assert r.headers["X-Total-Count"] == "3"

    def test_estado_invalido(self, client: TestClient):
        assert client.get("/projects", params={"status": "activo"}).status_code == 422

    def test_busca_en_el_nombre_y_en_el_cliente(self, client: TestClient):
        by_name = client.get("/projects", params={"q": "portal"}).json()
        assert {p["id"] for p in by_name} == {1, 14}
        by_client = client.get("/projects", params={"q": "hooli"}).json()
        assert by_client and all(p["client"] == "Hooli" for p in by_client)

    def test_pagina(self, client: TestClient):
        r = client.get("/projects", params={"_limit": 5, "_page": 2})
        assert [p["id"] for p in r.json()] == [6, 7, 8, 9, 10]
        assert r.headers["X-Total-Count"] == "20"

    def test_los_filtros_se_combinan(self, client: TestClient):
        r = client.get("/projects", params={"status": "completed", "q": "portal"})
        assert [p["id"] for p in r.json()] == [1]


class TestCrear:
    def test_solo_con_nombre_y_cliente(self, client: TestClient):
        created = create(client)
        assert created["id"] > 20
        assert (created["status"], created["endDate"], created["memberIds"]) == ("active", None, [])
        assert len(created["startDate"]) == 10  # hoy
        assert client.get(f"/projects/{created['id']}").json() == created

    def test_con_todos_los_campos(self, client: TestClient):
        created = create(client, status="completed", startDate="2026-01-10", endDate="2026-03-31")
        assert (created["status"], created["startDate"], created["endDate"]) == ("completed", "2026-01-10", "2026-03-31")

    def test_recorta_y_valida_los_textos(self, client: TestClient):
        created = client.post("/projects", json={"name": "  Con espacios  ", "client": "  Globex "}).json()
        assert (created["name"], created["client"]) == ("Con espacios", "Globex")
        assert client.post("/projects", json={"name": "ab", "client": "Acme"}).status_code == 422
        assert client.post("/projects", json={"name": "x" * 121, "client": "Acme"}).status_code == 422
        assert client.post("/projects", json={"name": "Nombre válido", "client": ""}).status_code == 422
        assert client.post("/projects", json={"name": "Nombre válido"}).status_code == 422

    def test_valida_estado_y_fechas(self, client: TestClient):
        assert client.post("/projects", json={**NEW_PROJECT, "status": "activo"}).status_code == 422
        assert client.post("/projects", json={**NEW_PROJECT, "startDate": "2026-02-30"}).status_code == 422
        assert client.post("/projects", json={**NEW_PROJECT, "startDate": "10/02/2026"}).status_code == 422
        r = client.post("/projects", json={**NEW_PROJECT, "startDate": "2026-03-10", "endDate": "2026-03-01"})
        assert r.status_code == 422

    def test_una_fecha_de_fin_anterior_a_hoy_sin_inicio_se_rechaza(self, client: TestClient):
        assert client.post("/projects", json={**NEW_PROJECT, "endDate": "2000-01-01"}).status_code == 422

    def test_un_id_ocupado_da_409_y_uno_libre_se_respeta(self, client: TestClient):
        assert client.post("/projects", json={**NEW_PROJECT, "id": 3}).status_code == 409
        assert create(client, id=500)["id"] == 500

    def test_restaurar_un_proyecto_borrado_lo_deja_como_era(self, client: TestClient):
        original = client.get("/projects/9").json()
        client.delete("/projects/9")
        body = {k: original[k] for k in ("id", "name", "client", "status", "startDate", "endDate")}
        r = client.post("/projects", json=body)
        assert r.status_code == 201
        assert r.json() == {**original, "memberIds": []}  # el equipo no se restaura (quedó libre)


class TestSustituir:
    def test_cambia_nombre_cliente_y_los_campos_enviados(self, client: TestClient):
        r = client.put("/projects/2", json={"name": "Nombre nuevo", "client": "Initech", "status": "paused", "startDate": "2025-02-01"})
        assert r.status_code == 200
        assert (r.json()["name"], r.json()["client"], r.json()["status"], r.json()["startDate"]) == ("Nombre nuevo", "Initech", "paused", "2025-02-01")

    def test_lo_que_no_se_envia_se_conserva(self, client: TestClient):
        before = client.get("/projects/1").json()
        r = client.put("/projects/1", json={"name": "Solo el nombre", "client": before["client"]})
        assert r.json()["name"] == "Solo el nombre"
        for field in ("status", "startDate", "endDate"):
            assert r.json()[field] == before[field], field

    def test_null_borra_la_fecha_de_fin(self, client: TestClient):
        r = client.put("/projects/1", json={"name": "Portal de clientes", "client": "Globex", "endDate": None})
        assert r.json()["endDate"] is None

    def test_no_toca_el_equipo(self, client: TestClient):
        r = client.put("/projects/8", json={"name": "Renombrado", "client": "Acme Corp"})
        assert r.json()["memberIds"] == [1]

    def test_valida_las_fechas_contra_las_conservadas(self, client: TestClient):
        # el proyecto 1 empieza en 2025-01-01: una fecha de fin anterior se rechaza aunque no se envíe la de inicio
        r = client.put("/projects/1", json={"name": "Portal de clientes", "client": "Globex", "endDate": "2024-12-31"})
        assert r.status_code == 422
        assert client.put("/projects/999", json=NEW_PROJECT).status_code == 404


class TestPatch:
    def test_cambia_solo_lo_enviado(self, client: TestClient):
        before = client.get("/projects/2").json()
        r = client.patch("/projects/2", json={"status": "completed", "endDate": "2026-06-30"})
        assert r.json() == {**before, "status": "completed", "endDate": "2026-06-30"}

    def test_null_borra_la_fecha_de_fin_pero_no_el_resto(self, client: TestClient):
        assert client.patch("/projects/1", json={"endDate": None}).json()["endDate"] is None
        for field in ("name", "client", "status", "startDate"):
            assert client.patch("/projects/1", json={field: None}).status_code == 422, field

    def test_valida_el_orden_de_las_fechas_contra_las_guardadas(self, client: TestClient):
        assert client.patch("/projects/1", json={"endDate": "2024-01-01"}).status_code == 422
        assert client.patch("/projects/2", json={"startDate": "2030-01-01", "endDate": "2029-01-01"}).status_code == 422

    def test_valida_estado_y_textos(self, client: TestClient):
        assert client.patch("/projects/2", json={"status": "activo"}).status_code == 422
        assert client.patch("/projects/2", json={"name": "ab"}).status_code == 422
        assert client.patch("/projects/999", json={"name": "Inexistente"}).status_code == 404


class TestBorrar:
    def test_borra_y_ya_no_existe(self, client: TestClient):
        assert client.delete("/projects/5").status_code == 204
        assert client.get("/projects/5").status_code == 404
        assert client.get("/projects").headers["X-Total-Count"] == "19"
        assert client.delete("/projects/5").status_code == 404

    def test_el_equipo_queda_sin_proyecto_y_disponible(self, client: TestClient):
        assert client.get("/users/1").json()["available"] is False
        client.delete("/projects/8")
        user = client.get("/users/1").json()
        assert (user["projectId"], user["available"]) == (None, True)

    def test_no_se_reutiliza_el_id(self, client: TestClient):
        client.delete(f"/projects/{create(client)['id']}")
        assert create(client)["id"] > 21


class TestCompatibilidad:
    def test_las_tareas_no_cambian(self, client: TestClient):
        """/projects es un recurso nuevo: /todos sigue igual (lo usan el Lab 10 y los labs de tareas)."""
        todo = client.get("/todos/1").json()
        assert set(todo) == {"id", "userId", "title", "completed", "createdAt", "priority", "description", "startDate", "endDate", "tags"}
        assert client.get("/todos").headers["X-Total-Count"] == "200"

    def test_un_usuario_conserva_sus_campos_de_siempre(self, client: TestClient):
        user = client.get("/users/1").json()
        for field in ("id", "name", "username", "email", "phone", "website", "address", "company"):
            assert field in user
        assert user["address"]["city"] == "Gwenborough"
