@echo off
rem Arranca el backend en Windows: crea el entorno virtual la primera vez e instala las dependencias.
rem Uso: start.cmd [--port 8000] [--reset]
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Creando el entorno virtual...
  where py >nul 2>nul
  if errorlevel 1 (python -m venv .venv) else (py -3 -m venv .venv)
  if errorlevel 1 (
    echo No se pudo crear el entorno virtual. Instala Python 3.11 o superior.
    exit /b 1
  )
)

".venv\Scripts\python.exe" -m pip install -q -r requirements.txt
if errorlevel 1 exit /b 1

".venv\Scripts\python.exe" run.py %*
