from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    """Base de datos nueva y aislada para cada test."""
    return tmp_path / "test.db"


@pytest.fixture
def client(db_path: Path) -> TestClient:
    return TestClient(create_app(db_path))


NEW_USER = {"name": "Ada Lovelace", "email": "ada@example.com", "phone": "123-456"}
