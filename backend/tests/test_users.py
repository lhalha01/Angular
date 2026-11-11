from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

from .conftest import NEW_USER


class TestList:
    def test_devuelve_los_10_usuarios_iniciales(self, client: TestClient):
        r = client.get("/users")
        assert r.status_code == 200
        assert len(r.json()) == 10
        assert r.headers["X-Total-Count"] == "10"

    def test_conserva_el_formato_de_jsonplaceholder(self, client: TestClient):
        first = client.get("/users").json()[0]
        assert first["id"] == 1
        assert first["name"] == "Leanne Graham"
        assert first["username"] == "Bret"
        assert first["address"]["city"] == "Gwenborough"
        assert first["company"]["name"] == "Romaguera-Crona"

    def test_pagina_con_page_y_limit(self, client: TestClient):
        r = client.get("/users", params={"_page": 2, "_limit": 4})
        assert [u["id"] for u in r.json()] == [5, 6, 7, 8]
        assert r.headers["X-Total-Count"] == "10"  # el total es antes de paginar

    def test_ultima_pagina_incompleta(self, client: TestClient):
        r = client.get("/users", params={"_page": 3, "_limit": 4})
        assert [u["id"] for u in r.json()] == [9, 10]

    def test_pagina_fuera_de_rango_devuelve_lista_vacia(self, client: TestClient):
        r = client.get("/users", params={"_page": 99, "_limit": 4})
        assert r.json() == []

    def test_busca_por_nombre_usuario_o_email_sin_distinguir_mayusculas(self, client: TestClient):
        assert [u["id"] for u in client.get("/users", params={"q": "LEANNE"}).json()] == [1]
        assert [u["id"] for u in client.get("/users", params={"q": "antonette"}).json()] == [2]
        assert [u["id"] for u in client.get("/users", params={"q": "shanna@"}).json()] == [2]

    def test_busqueda_y_paginacion_se_combinan(self, client: TestClient):
        r = client.get("/users", params={"q": "a", "_limit": 3})
        assert len(r.json()) == 3
        assert int(r.headers["X-Total-Count"]) > 3

    def test_rechaza_parametros_de_paginacion_invalidos(self, client: TestClient):
        assert client.get("/users", params={"_page": 0}).status_code == 422
        assert client.get("/users", params={"_limit": 0}).status_code == 422
        assert client.get("/users", params={"_limit": 101}).status_code == 422


class TestGet:
    def test_devuelve_un_usuario(self, client: TestClient):
        r = client.get("/users/3")
        assert r.status_code == 200
        assert r.json()["name"] == "Clementine Bauch"

    def test_404_si_no_existe(self, client: TestClient):
        assert client.get("/users/999").status_code == 404

    def test_422_si_el_id_no_es_un_numero(self, client: TestClient):
        assert client.get("/users/abc").status_code == 422


class TestCreate:
    def test_crea_con_id_asignado_por_el_servidor(self, client: TestClient):
        r = client.post("/users", json=NEW_USER)
        assert r.status_code == 201
        assert r.json()["id"] == 11
        assert r.json()["name"] == "Ada Lovelace"
        assert client.get("/users/11").json()["email"] == "ada@example.com"
        assert client.get("/users").headers["X-Total-Count"] == "11"

    def test_los_campos_opcionales_quedan_vacios(self, client: TestClient):
        created = client.post("/users", json={"name": "Ana", "email": "ana@x.com"}).json()
        assert created["username"] is None
        assert created["address"] is None

    def test_acepta_direccion_y_empresa_anidadas(self, client: TestClient):
        body = {**NEW_USER, "address": {"city": "Madrid"}, "company": {"name": "ACME"}}
        created = client.post("/users", json=body).json()
        assert created["address"]["city"] == "Madrid"
        assert created["company"]["name"] == "ACME"

    def test_quita_espacios_alrededor_de_nombre_y_email(self, client: TestClient):
        created = client.post("/users", json={"name": "  Ana  ", "email": " ana@x.com "}).json()
        assert created["name"] == "Ana"
        assert created["email"] == "ana@x.com"

    def test_rechaza_nombre_vacio_o_en_blanco(self, client: TestClient):
        assert client.post("/users", json={**NEW_USER, "name": ""}).status_code == 422
        assert client.post("/users", json={**NEW_USER, "name": "   "}).status_code == 422

    def test_rechaza_email_invalido(self, client: TestClient):
        for email in ["sin-arroba", "a@b", "@x.com", "a b@x.com"]:
            assert client.post("/users", json={**NEW_USER, "email": email}).status_code == 422

    def test_rechaza_si_faltan_campos_obligatorios(self, client: TestClient):
        assert client.post("/users", json={"name": "Ana"}).status_code == 422
        assert client.post("/users", json={"email": "ana@x.com"}).status_code == 422

    def test_un_rechazo_no_guarda_nada(self, client: TestClient):
        client.post("/users", json={**NEW_USER, "email": "mal"})
        assert client.get("/users").headers["X-Total-Count"] == "10"


class TestReplace:
    def test_put_sustituye_el_usuario_completo(self, client: TestClient):
        r = client.put("/users/1", json={"name": "Nuevo", "email": "nuevo@x.com"})
        assert r.status_code == 200
        user = client.get("/users/1").json()
        assert user["name"] == "Nuevo"
        # Es una sustitución: lo que no se envía queda vacío.
        assert user["username"] is None
        assert user["address"] is None

    def test_put_404_si_no_existe(self, client: TestClient):
        assert client.put("/users/999", json=NEW_USER).status_code == 404

    def test_put_valida_el_cuerpo(self, client: TestClient):
        assert client.put("/users/1", json={"name": "", "email": "a@b.co"}).status_code == 422


class TestPatch:
    def test_patch_cambia_solo_los_campos_enviados(self, client: TestClient):
        client.patch("/users/1", json={"name": "Cambiado"})
        user = client.get("/users/1").json()
        assert user["name"] == "Cambiado"
        assert user["username"] == "Bret"  # intacto
        assert user["email"] == "Sincere@april.biz"

    def test_patch_combina_los_objetos_anidados(self, client: TestClient):
        client.patch("/users/1", json={"address": {"city": "Madrid"}})
        address = client.get("/users/1").json()["address"]
        assert address["city"] == "Madrid"
        assert address["street"] == "Kulas Light"  # el resto de la dirección se conserva
        assert address["geo"]["lat"] == "-37.3159"

    def test_patch_combina_la_empresa(self, client: TestClient):
        client.patch("/users/1", json={"company": {"name": "Nueva SL"}})
        company = client.get("/users/1").json()["company"]
        assert company["name"] == "Nueva SL"
        assert company["bs"] == "harness real-time e-markets"

    def test_patch_no_permite_dejar_nombre_ni_email_nulos(self, client: TestClient):
        assert client.patch("/users/1", json={"name": None}).status_code == 422
        assert client.patch("/users/1", json={"email": None}).status_code == 422
        assert client.get("/users/1").json()["name"] == "Leanne Graham"

    def test_patch_valida_el_formato(self, client: TestClient):
        assert client.patch("/users/1", json={"email": "mal"}).status_code == 422

    def test_patch_404_si_no_existe(self, client: TestClient):
        assert client.patch("/users/999", json={"name": "X"}).status_code == 404


class TestDelete:
    def test_borra_y_ya_no_existe(self, client: TestClient):
        r = client.delete("/users/1")
        assert r.status_code == 204
        assert r.content == b""
        assert client.get("/users/1").status_code == 404
        assert client.get("/users").headers["X-Total-Count"] == "9"

    def test_borrar_dos_veces_da_404(self, client: TestClient):
        client.delete("/users/1")
        assert client.delete("/users/1").status_code == 404

    def test_no_reutiliza_el_id_de_un_usuario_borrado(self, client: TestClient):
        first = client.post("/users", json=NEW_USER).json()["id"]
        client.delete(f"/users/{first}")
        second = client.post("/users", json=NEW_USER).json()["id"]
        assert second == first + 1


class TestPersistence:
    def test_los_cambios_sobreviven_a_un_reinicio_del_servidor(self, db_path: Path):
        first_run = TestClient(create_app(db_path))
        first_run.post("/users", json=NEW_USER)
        first_run.patch("/users/2", json={"name": "Editado"})
        first_run.delete("/users/3")

        restarted = TestClient(create_app(db_path))  # nueva instancia sobre el mismo archivo
        users = {u["id"]: u for u in restarted.get("/users").json()}
        assert 11 in users and users[11]["name"] == "Ada Lovelace"
        assert users[2]["name"] == "Editado"
        assert 3 not in users

    def test_los_usuarios_borrados_no_resucitan_al_reiniciar(self, db_path: Path):
        first_run = TestClient(create_app(db_path))
        for user_id in range(1, 11):
            first_run.delete(f"/users/{user_id}")
        restarted = TestClient(create_app(db_path))
        assert restarted.get("/users").json() == []  # no se vuelve a sembrar

    def test_cada_base_de_datos_nueva_parte_de_los_datos_iniciales(self, tmp_path: Path):
        a = TestClient(create_app(tmp_path / "a.db"))
        a.delete("/users/1")
        b = TestClient(create_app(tmp_path / "b.db"))
        assert b.get("/users").headers["X-Total-Count"] == "10"


class TestCors:
    def test_permite_la_app_angular_en_localhost_con_cualquier_puerto(self, client: TestClient):
        for origin in ["http://localhost:4200", "http://localhost:4211", "http://127.0.0.1:4200"]:
            r = client.get("/users", headers={"Origin": origin})
            assert r.headers["access-control-allow-origin"] == origin

    def test_no_permite_otros_origenes(self, client: TestClient):
        for origin in ["https://example.com", "http://localhost.evil.com", "http://evil.com:4200"]:
            r = client.get("/users", headers={"Origin": origin})
            assert "access-control-allow-origin" not in r.headers

    def test_el_preflight_de_patch_y_delete_esta_permitido(self, client: TestClient):
        for method in ["PATCH", "DELETE", "PUT", "POST"]:
            r = client.options(
                "/users/1",
                headers={
                    "Origin": "http://localhost:4211",
                    "Access-Control-Request-Method": method,
                    "Access-Control-Request-Headers": "content-type",
                },
            )
            assert r.status_code == 200, method
            assert method in r.headers["access-control-allow-methods"]

    def test_expone_x_total_count_al_navegador(self, client: TestClient):
        r = client.get("/users", headers={"Origin": "http://localhost:4200"})
        assert "x-total-count" in r.headers["access-control-expose-headers"].lower()


class TestInfo:
    def test_raiz_y_health(self, client: TestClient):
        assert client.get("/").json()["resources"] == ["/users", "/todos"]
        assert client.get("/health").json() == {"status": "ok"}
