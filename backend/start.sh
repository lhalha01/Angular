#!/usr/bin/env sh
# Arranca el backend en Linux/macOS: crea el entorno virtual la primera vez e instala las dependencias.
# Uso: ./start.sh [--port 8000] [--reset]
set -e
cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
  echo "Creando el entorno virtual..."
  python3 -m venv .venv
fi

.venv/bin/python -m pip install -q -r requirements.txt
exec .venv/bin/python run.py "$@"
