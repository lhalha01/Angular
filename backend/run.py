"""Arranca el backend: `python run.py [--port 8000] [--reset]`."""

import argparse

import uvicorn

from app import config
from app.main import create_app


def main() -> None:
    parser = argparse.ArgumentParser(description="Backend de los labs de Angular")
    parser.add_argument("--host", default="127.0.0.1", help="por defecto solo accesible desde este equipo")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="borra la base de datos y vuelve a los datos iniciales",
    )
    args = parser.parse_args()

    if args.reset and config.DB_PATH.exists():
        config.DB_PATH.unlink()
        print(f"Base de datos reiniciada: {config.DB_PATH}")

    print(f"Documentación interactiva: http://{args.host}:{args.port}/docs")
    uvicorn.run(create_app(), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
