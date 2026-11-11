"""Configuración del backend."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Base de datos SQLite. Se crea sola la primera vez que arranca el servidor.
# Se puede cambiar con la variable de entorno BACKEND_DB.
DB_PATH = Path(os.environ.get("BACKEND_DB", BASE_DIR / "data" / "app.db"))

# Datos iniciales de cada recurso (copiados una vez de JSONPlaceholder).
SEED_DIR = Path(__file__).resolve().parent / "seed"

# Orígenes que pueden llamar a la API desde el navegador: la aplicación Angular en
# `ng serve` corre en localhost con cualquier puerto (4200, 4211...).
CORS_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
