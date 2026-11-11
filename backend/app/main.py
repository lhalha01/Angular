"""Aplicación FastAPI. Cada recurso (users, y los que vengan) es un router independiente."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .db import init_db
from .routers import todos, users


def create_app(db_path: Path | None = None) -> FastAPI:
    db_path = db_path or config.DB_PATH
    init_db(db_path)

    app = FastAPI(
        title="Backend de los labs de Angular",
        description="APIs REST locales que sustituyen a las públicas (JSONPlaceholder) y guardan los cambios.",
        version="1.0.0",
    )
    app.state.db_path = db_path

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=config.CORS_ORIGIN_REGEX,
        allow_methods=["*"],
        allow_headers=["*"],
        # Sin esto el navegador no deja leer la cabecera de paginación desde JavaScript.
        expose_headers=["X-Total-Count"],
    )

    app.include_router(users.router)
    app.include_router(todos.router)

    @app.get("/", tags=["info"])
    def root() -> dict[str, object]:
        return {"name": app.title, "docs": "/docs", "resources": ["/users", "/todos"]}

    @app.get("/health", tags=["info"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app
