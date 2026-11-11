"""Pruebas contra un servidor real (uvicorn), sin TestClient.

`TestClient` espera a que la aplicación termine del todo antes de devolver la respuesta, así que
no puede detectar un fallo de orden: que el servidor responda *antes* de confirmar (commit) el
cambio. Un cliente real, que lee justo después de escribir, sí lo sufre. Esta prueba lo reproduce.
"""

import socket
import threading
import time
from collections.abc import Iterator
from pathlib import Path

import httpx2 as httpx
import pytest
import uvicorn

from app.main import create_app


@pytest.fixture
def live_url(tmp_path: Path) -> Iterator[str]:
    with socket.socket() as s:  # un puerto libre
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]

    server = uvicorn.Server(
        uvicorn.Config(create_app(tmp_path / "live.db"), host="127.0.0.1", port=port, log_level="warning")
    )
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.time() + 10
    while not server.started and time.time() < deadline:
        time.sleep(0.05)
    assert server.started, "el servidor no arrancó"
    try:
        yield f"http://127.0.0.1:{port}"
    finally:
        server.should_exit = True
        thread.join(timeout=10)


ROUNDS = 60  # con el fallo, falla prácticamente el 100 %; 60 vueltas lo detectan sin dudar


def test_leer_justo_despues_de_escribir_ve_siempre_el_cambio_en_todos(live_url: str):
    with httpx.Client(base_url=live_url) as c:
        for i in range(ROUNDS):
            created = c.post("/todos", json={"userId": 1, "title": f"carrera {i}"}).json()
            assert c.get(f"/todos/{created['id']}").status_code == 200, "una lectura inmediata no vio el alta"

            c.patch(f"/todos/{created['id']}", json={"completed": True})
            assert c.get(f"/todos/{created['id']}").json()["completed"] is True, "no vio el cambio"

            c.delete(f"/todos/{created['id']}")
            assert c.get(f"/todos/{created['id']}").status_code == 404, "una lectura inmediata aún veía lo borrado"


def test_leer_justo_despues_de_escribir_ve_siempre_el_cambio_en_users(live_url: str):
    with httpx.Client(base_url=live_url) as c:
        for i in range(ROUNDS):
            created = c.post("/users", json={"name": f"Usuario {i}", "email": f"u{i}@x.com"}).json()
            assert c.get(f"/users/{created['id']}").status_code == 200, "una lectura inmediata no vio el alta"
            c.delete(f"/users/{created['id']}")
            assert c.get(f"/users/{created['id']}").status_code == 404, "una lectura inmediata aún veía lo borrado"


def test_aguanta_peticiones_simultaneas_de_lectura(live_url: str):
    """Un navegador pide varios recursos a la vez al cargar la app. Si la conexión a SQLite no
    admite que cambie de hilo, casi todas fallan con un 500 (que además sale sin cabeceras de
    CORS, así que el navegador lo muestra como un error de CORS)."""
    from concurrent.futures import ThreadPoolExecutor

    def get(path: str) -> int:
        with httpx.Client(base_url=live_url, timeout=20) as c:
            return c.get(path).status_code

    paths = ["/todos", "/users"] * 40
    with ThreadPoolExecutor(max_workers=16) as pool:
        statuses = list(pool.map(get, paths))
    assert statuses.count(200) == len(paths), {s: statuses.count(s) for s in set(statuses)}


def test_aguanta_lecturas_y_escrituras_simultaneas_sin_perder_ni_duplicar_datos(live_url: str):
    from concurrent.futures import ThreadPoolExecutor

    def create(i: int) -> tuple[int, int | None]:
        with httpx.Client(base_url=live_url, timeout=20) as c:
            r = c.post("/todos", json={"userId": 1, "title": f"Concurrente {i}"})
            return r.status_code, (r.json()["id"] if r.status_code == 201 else None)

    def read(_: int) -> int:
        with httpx.Client(base_url=live_url, timeout=20) as c:
            return c.get("/todos").status_code

    with httpx.Client(base_url=live_url) as c:
        before = int(c.get("/todos").headers["X-Total-Count"])

    with ThreadPoolExecutor(max_workers=16) as pool:
        reads = [pool.submit(read, i) for i in range(30)]
        creates = [pool.submit(create, i) for i in range(30)]
        read_statuses = [f.result() for f in reads]
        created = [f.result() for f in creates]

    assert all(s == 200 for s in read_statuses), read_statuses
    assert all(s == 201 for s, _ in created), created
    ids = [i for _, i in created]
    assert len(set(ids)) == 30, "ids duplicados"  # el servidor reparte ids distintos
    with httpx.Client(base_url=live_url) as c:
        assert int(c.get("/todos").headers["X-Total-Count"]) == before + 30


def test_el_total_refleja_de_inmediato_las_escrituras(live_url: str):
    with httpx.Client(base_url=live_url) as c:
        before = int(c.get("/todos").headers["X-Total-Count"])
        c.post("/todos", json={"userId": 1, "title": "Una más"})
        assert int(c.get("/todos").headers["X-Total-Count"]) == before + 1
