"""`POST /users` con `id` opcional: permite restaurar un usuario borrado con su mismo id."""

from fastapi.testclient import TestClient

from .conftest import NEW_USER


def test_respeta_el_id_enviado_si_esta_libre(client: TestClient):
    client.delete("/users/4")
    r = client.post("/users", json={**NEW_USER, "id": 4})
    assert r.status_code == 201
    assert r.json()["id"] == 4


def test_responde_409_si_el_id_esta_en_uso_y_no_toca_el_existente(client: TestClient):
    original = client.get("/users/3").json()
    r = client.post("/users", json={**NEW_USER, "id": 3})
    assert r.status_code == 409
    assert client.get("/users/3").json() == original


def test_rechaza_ids_no_validos(client: TestClient):
    assert client.post("/users", json={**NEW_USER, "id": 0}).status_code == 422
    assert client.post("/users", json={**NEW_USER, "id": "uno"}).status_code == 422


def test_sin_id_sigue_asignandolo_el_servidor(client: TestClient):
    assert client.post("/users", json=NEW_USER).json()["id"] == 11


def test_flujo_borrar_y_restaurar_deja_el_usuario_identico(client: TestClient):
    before = client.get("/users/2").json()
    client.delete("/users/2")
    restored = client.post("/users", json=before)  # reenvía el usuario tal cual (incluido su id)
    assert restored.status_code == 201
    assert restored.json() == before
