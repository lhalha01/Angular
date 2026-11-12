"""Datos de empleado de `/users` (TalentHub): `role`, `skills`, `available`, `projectId` y `hiredAt`. Esquema v5."""

from fastapi.testclient import TestClient

NEW_USER = {"name": "Marta Ruiz", "email": "marta@example.com"}
EMPLOYEE_KEYS = ("role", "skills", "available", "projectId", "hiredAt")


def create(client: TestClient, **extra) -> dict:
    r = client.post("/users", json={**NEW_USER, **extra})
    assert r.status_code == 201, r.text
    return r.json()


class TestDatosIniciales:
    def test_los_diez_usuarios_iniciales_son_empleados_completos(self, client: TestClient):
        users = client.get("/users").json()
        assert len(users) == 10
        for u in users:
            assert u["role"] in ("desarrollador", "diseñador", "qa", "devops", "manager")
            assert len(u["skills"]) == 3 and all(s["level"] in ("junior", "mid", "senior") for s in u["skills"])
            assert isinstance(u["available"], bool)
            assert u["hiredAt"]

    def test_reparte_los_cinco_roles_dos_veces(self, client: TestClient):
        roles = [u["role"] for u in client.get("/users").json()]
        assert sorted(set(roles)) == ["desarrollador", "devops", "diseñador", "manager", "qa"]
        assert all(roles.count(r) == 2 for r in set(roles))

    def test_los_ocupados_tienen_proyecto_y_los_disponibles_no(self, client: TestClient):
        for u in client.get("/users").json():
            assert (u["projectId"] is None) == u["available"]
            assert u["available"] == (u["id"] % 2 == 0)

    def test_el_proyecto_de_un_ocupado_existe_y_lo_tiene_en_su_equipo(self, client: TestClient):
        for u in client.get("/users").json():
            if u["projectId"] is not None:
                project = client.get(f"/projects/{u['projectId']}").json()
                assert u["id"] in project["memberIds"]


class TestCrear:
    def test_sin_datos_de_empleado_usa_los_valores_por_defecto(self, client: TestClient):
        """Un cliente anterior (Lab 10.1, TalentHub hasta el Lab 19) crea usuarios solo con nombre y email."""
        created = create(client)
        assert (created["role"], created["skills"], created["available"], created["projectId"]) == ("desarrollador", [], True, None)
        assert len(created["hiredAt"]) == 10  # la fecha de hoy, AAAA-MM-DD

    def test_guarda_y_devuelve_todos_los_datos(self, client: TestClient):
        created = create(
            client,
            role="qa",
            skills=[{"name": "Cypress", "level": "senior"}, {"name": "SQL", "level": "junior"}],
            available=False,
            projectId=3,
            hiredAt="2026-02-10",
        )
        assert created["role"] == "qa"
        assert created["skills"] == [{"name": "Cypress", "level": "senior"}, {"name": "SQL", "level": "junior"}]
        assert (created["available"], created["projectId"], created["hiredAt"]) == (False, 3, "2026-02-10")
        assert client.get(f"/users/{created['id']}").json() == created  # sobreviven a la lectura

    def test_el_orden_de_las_habilidades_se_conserva_y_se_recortan(self, client: TestClient):
        skills = [{"name": "  Zeta ", "level": "mid"}, {"name": "ñandú", "level": "junior"}]
        assert [s["name"] for s in create(client, skills=skills)["skills"]] == ["Zeta", "ñandú"]

    def test_un_empleado_ocupado_se_asigna_a_un_proyecto_y_entra_en_su_equipo(self, client: TestClient):
        created = create(client, available=False, projectId=5)
        assert created["id"] in client.get("/projects/5").json()["memberIds"]

    def test_restaurar_un_usuario_conserva_sus_datos_de_empleado(self, client: TestClient):
        original = create(client, role="devops", available=False, projectId=7, skills=[{"name": "Docker", "level": "mid"}])
        client.delete(f"/users/{original['id']}")
        restored = client.post("/users", json=original)
        assert restored.status_code == 201
        assert restored.json() == original


class TestValidacion:
    def test_un_no_disponible_necesita_proyecto(self, client: TestClient):
        r = client.post("/users", json={**NEW_USER, "available": False})
        assert r.status_code == 422
        assert "proyecto" in r.json()["detail"]
        assert client.post("/users", json={**NEW_USER, "available": False, "projectId": None}).status_code == 422

    def test_el_proyecto_debe_existir(self, client: TestClient):
        r = client.post("/users", json={**NEW_USER, "available": False, "projectId": 999})
        assert r.status_code == 422
        assert "999" in r.json()["detail"]
        assert client.post("/users", json={**NEW_USER, "projectId": 999}).status_code == 422  # ni siquiera disponible

    def test_un_disponible_puede_tener_proyecto(self, client: TestClient):
        assert create(client, available=True, projectId=2)["projectId"] == 2

    def test_rol_invalido(self, client: TestClient):
        for invalid in ("jefe", "", None, 3):
            assert client.post("/users", json={**NEW_USER, "role": invalid}).status_code == 422, invalid

    def test_habilidades_validas_e_invalidas(self, client: TestClient):
        ok = {"name": "Angular", "level": "senior"}
        assert client.post("/users", json={**NEW_USER, "skills": [ok]}).status_code == 201
        for bad in (
            [{"name": "", "level": "mid"}],
            [{"name": "x" * 31, "level": "mid"}],
            [{"name": "Angular", "level": "experto"}],
            [{"name": "Angular"}],
            ["Angular"],
        ):
            assert client.post("/users", json={**NEW_USER, "skills": bad}).status_code == 422, bad

    def test_como_mucho_20_habilidades(self, client: TestClient):
        skill = {"name": "Angular", "level": "mid"}
        assert client.post("/users", json={**NEW_USER, "skills": [skill] * 20}).status_code == 201
        assert client.post("/users", json={**NEW_USER, "skills": [skill] * 21}).status_code == 422

    def test_la_fecha_de_incorporacion_debe_existir_de_verdad(self, client: TestClient):
        assert client.post("/users", json={**NEW_USER, "hiredAt": "2026-02-30"}).status_code == 422
        assert client.post("/users", json={**NEW_USER, "hiredAt": "10/02/2026"}).status_code == 422
        assert client.post("/users", json={**NEW_USER, "hiredAt": "2026-02-28"}).status_code == 201


class TestSustituir:
    def test_put_sin_datos_de_empleado_los_conserva(self, client: TestClient):
        """El Lab 10.1 (1-Basico) guarda con PUT solo los datos que conoce: no debe reiniciar el rol ni el proyecto."""
        user = create(client, role="manager", available=False, projectId=4, skills=[{"name": "Scrum", "level": "senior"}], hiredAt="2025-05-05")
        r = client.put(f"/users/{user['id']}", json={"name": "Marta R.", "email": "marta@example.com"})
        assert r.status_code == 200
        assert r.json()["name"] == "Marta R."
        assert {k: r.json()[k] for k in EMPLOYEE_KEYS} == {k: user[k] for k in EMPLOYEE_KEYS}

    def test_put_con_datos_de_empleado_los_cambia(self, client: TestClient):
        user = create(client)
        r = client.put(f"/users/{user['id']}", json={**NEW_USER, "role": "diseñador", "available": False, "projectId": 2})
        assert (r.json()["role"], r.json()["available"], r.json()["projectId"]) == ("diseñador", False, 2)

    def test_put_con_null_borra_el_proyecto_y_la_fecha(self, client: TestClient):
        user = create(client, projectId=4, hiredAt="2025-05-05")
        r = client.put(f"/users/{user['id']}", json={**NEW_USER, "projectId": None, "hiredAt": None})
        assert (r.json()["projectId"], r.json()["hiredAt"]) == (None, None)

    def test_put_valida_la_regla_contra_los_datos_conservados(self, client: TestClient):
        user = create(client, available=False, projectId=4)
        # solo quita el proyecto: queda ocupado sin proyecto
        assert client.put(f"/users/{user['id']}", json={**NEW_USER, "projectId": None}).status_code == 422
        # solo marca como no disponible a alguien que no tiene proyecto
        free = create(client, email="otro@example.com")
        assert client.put(f"/users/{free['id']}", json={**NEW_USER, "available": False}).status_code == 422

    def test_put_con_valores_invalidos_se_rechaza(self, client: TestClient):
        user = create(client)
        assert client.put(f"/users/{user['id']}", json={**NEW_USER, "role": "jefe"}).status_code == 422
        assert client.put(f"/users/{user['id']}", json={**NEW_USER, "projectId": 999}).status_code == 422


class TestPatch:
    def test_cambia_solo_lo_enviado(self, client: TestClient):
        user = create(client, role="qa")
        r = client.patch(f"/users/{user['id']}", json={"available": False, "projectId": 6})
        assert r.status_code == 200
        assert r.json() == {**user, "available": False, "projectId": 6}

    def test_otros_cambios_no_tocan_los_datos_de_empleado(self, client: TestClient):
        user = create(client, role="devops", available=False, projectId=3)
        r = client.patch(f"/users/{user['id']}", json={"phone": "555"})
        assert {k: r.json()[k] for k in EMPLOYEE_KEYS} == {k: user[k] for k in EMPLOYEE_KEYS}

    def test_null_borra_el_proyecto_y_la_fecha_pero_no_el_rol_ni_las_habilidades(self, client: TestClient):
        user = create(client, projectId=3, hiredAt="2025-05-05")
        r = client.patch(f"/users/{user['id']}", json={"projectId": None, "hiredAt": None})
        assert (r.json()["projectId"], r.json()["hiredAt"]) == (None, None)
        for field in ("role", "skills", "available"):
            assert client.patch(f"/users/{user['id']}", json={field: None}).status_code == 422, field

    def test_valida_la_regla_contra_los_datos_guardados(self, client: TestClient):
        busy = create(client, available=False, projectId=3)
        assert client.patch(f"/users/{busy['id']}", json={"projectId": None}).status_code == 422
        free = create(client, email="libre@example.com")
        assert client.patch(f"/users/{free['id']}", json={"available": False}).status_code == 422
        assert client.patch(f"/users/{free['id']}", json={"available": False, "projectId": 2}).status_code == 200

    def test_valida_rol_habilidades_proyecto_y_fecha(self, client: TestClient):
        user = create(client)
        for body in ({"role": "jefe"}, {"skills": [{"name": "", "level": "mid"}]}, {"projectId": 999}, {"hiredAt": "2026-13-01"}):
            assert client.patch(f"/users/{user['id']}", json=body).status_code == 422, body


class TestFiltros:
    def test_por_rol(self, client: TestClient):
        users = client.get("/users", params={"role": "qa"}).json()
        assert [u["id"] for u in users] == [3, 8]
        assert client.get("/users", params={"role": "qa"}).headers["X-Total-Count"] == "2"

    def test_por_disponibilidad(self, client: TestClient):
        assert [u["id"] for u in client.get("/users", params={"available": "true"}).json()] == [2, 4, 6, 8, 10]
        assert [u["id"] for u in client.get("/users", params={"available": "false"}).json()] == [1, 3, 5, 7, 9]

    def test_por_proyecto_es_el_equipo(self, client: TestClient):
        team = client.get("/users", params={"projectId": 8}).json()
        assert [u["id"] for u in team] == [1]
        assert client.get("/users", params={"projectId": 5}).json() == []

    def test_los_filtros_se_combinan_con_la_busqueda_y_la_paginacion(self, client: TestClient):
        r = client.get("/users", params={"role": "qa", "available": "true"})
        assert [u["id"] for u in r.json()] == [8]
        assert [u["id"] for u in client.get("/users", params={"available": "true", "_limit": 2, "_page": 2}).json()] == [6, 8]
        assert client.get("/users", params={"available": "true", "_limit": 2}).headers["X-Total-Count"] == "5"

    def test_valores_invalidos(self, client: TestClient):
        assert client.get("/users", params={"role": "jefe"}).status_code == 422
        assert client.get("/users", params={"projectId": 0}).status_code == 422


class TestRelacionConProyectos:
    def test_borrar_un_usuario_lo_saca_del_equipo(self, client: TestClient):
        assert client.get("/projects/8").json()["memberIds"] == [1]
        client.delete("/users/1")
        assert client.get("/projects/8").json()["memberIds"] == []

    def test_cambiar_el_proyecto_de_un_usuario_mueve_la_pertenencia(self, client: TestClient):
        client.patch("/users/1", json={"projectId": 5})
        assert client.get("/projects/8").json()["memberIds"] == []
        assert client.get("/projects/5").json()["memberIds"] == [1]
