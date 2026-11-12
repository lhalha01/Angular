"""Recurso /projects (proyectos de TalentHub).

Un proyecto tiene nombre, cliente, estado (`active`, `paused` o `completed`) y fechas. Su **equipo** (`memberIds`) no se
guarda aquí: son los usuarios cuyo `projectId` apunta al proyecto, así que asignar a alguien se hace desde `/users`.
Al borrar un proyecto, su equipo queda sin proyecto y disponible.
"""

import sqlite3
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from ..db import get_db
from ..schemas import (
    END_BEFORE_START,
    ProjectCreate,
    ProjectIn,
    ProjectOut,
    ProjectPatch,
    ProjectStatus,
    end_before_start,
)

router = APIRouter(prefix="/projects", tags=["projects"])

Db = Annotated[sqlite3.Connection, Depends(get_db, scope="function")]


def _members(db: sqlite3.Connection) -> dict[int, list[int]]:
    """Los ids del equipo de cada proyecto, con una sola consulta."""
    members: dict[int, list[int]] = {}
    for row in db.execute("SELECT id, project_id FROM users WHERE project_id IS NOT NULL ORDER BY id"):
        members.setdefault(row["project_id"], []).append(row["id"])
    return members


def _to_project(row: sqlite3.Row, members: dict[int, list[int]]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "client": row["client"],
        "status": row["status"],
        "startDate": row["start_date"],
        "endDate": row["end_date"],
        "memberIds": members.get(row["id"], []),
    }


def _fetch(db: sqlite3.Connection, project_id: int) -> dict[str, Any]:
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Proyecto {project_id} no encontrado")
    return _to_project(row, _members(db))


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _ensure_dates_in_order(start: str | None, end: str | None) -> None:
    """Comprueba el orden de las fechas cuando una viene del cuerpo y la otra del proyecto guardado."""
    if end_before_start(start, end):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, END_BEFORE_START)


@router.get("", response_model=list[ProjectOut])
def list_projects(
    response: Response,
    db: Db,
    project_status: Annotated[ProjectStatus | None, Query(alias="status")] = None,
    q: Annotated[str | None, Query(description="Busca en el nombre y en el cliente")] = None,
    page: Annotated[int | None, Query(alias="_page", ge=1)] = None,
    limit: Annotated[int | None, Query(alias="_limit", ge=1, le=200)] = None,
) -> list[dict[str, Any]]:
    """Lista proyectos, filtrando opcionalmente por `status` y `q`. Con `_page` y `_limit` pagina; `X-Total-Count`
    indica el total (ya filtrado, antes de paginar). Sin `_limit` devuelve todos."""
    conditions: list[str] = []
    params: list[Any] = []
    if project_status is not None:
        conditions.append("status = ?")
        params.append(project_status)
    if q and q.strip():
        conditions.append("(name LIKE ? OR client LIKE ?)")
        params += [f"%{q.strip()}%"] * 2
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = db.execute(f"SELECT COUNT(*) FROM projects {where}", params).fetchone()[0]
    response.headers["X-Total-Count"] = str(total)

    sql = f"SELECT * FROM projects {where} ORDER BY id"
    if limit is not None:
        sql += " LIMIT ? OFFSET ?"
        params = [*params, limit, ((page or 1) - 1) * limit]
    members = _members(db)
    return [_to_project(row, members) for row in db.execute(sql, params).fetchall()]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Db) -> dict[str, Any]:
    return _fetch(db, project_id)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, db: Db) -> dict[str, Any]:
    """Crea un proyecto. El id lo asigna el servidor, salvo que se envíe: entonces se usa si está libre (si no, 409).
    Sin fecha de inicio se toma la de hoy; el equipo empieza vacío."""
    if body.id is not None and db.execute("SELECT 1 FROM projects WHERE id = ?", (body.id,)).fetchone():
        raise HTTPException(status.HTTP_409_CONFLICT, f"El id {body.id} ya está en uso")
    start = body.startDate or _today()
    _ensure_dates_in_order(start, body.endDate)  # la fecha de inicio por defecto (hoy) también cuenta
    cursor = db.execute(
        "INSERT INTO projects (id, name, client, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)",
        (body.id, body.name, body.client, body.status, start, body.endDate),
    )
    return _fetch(db, cursor.lastrowid)


@router.put("/{project_id}", response_model=ProjectOut)
def replace_project(project_id: int, body: ProjectIn, db: Db) -> dict[str, Any]:
    """Sustituye el proyecto. `name` y `client` son obligatorios; `status`, `startDate` y `endDate` que el cuerpo no
    incluya se conservan (para quitar la fecha de fin hay que enviarla `null`). El equipo no se toca desde aquí."""
    current = _fetch(db, project_id)
    kept = {
        field: getattr(body, field) if field in body.model_fields_set else current[field]
        for field in ("status", "startDate", "endDate")
    }
    kept["startDate"] = kept["startDate"] or current["startDate"]
    _ensure_dates_in_order(kept["startDate"], kept["endDate"])
    db.execute(
        "UPDATE projects SET name = ?, client = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?",
        (body.name, body.client, kept["status"], kept["startDate"], kept["endDate"], project_id),
    )
    return _fetch(db, project_id)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, body: ProjectPatch, db: Db) -> dict[str, Any]:
    """Cambia solo los campos enviados."""
    current = _fetch(db, project_id)
    changes = body.model_dump(exclude_unset=True)
    for field in ("name", "client", "status", "startDate"):
        if field in changes and changes[field] is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"El campo '{field}' no puede ser nulo")
    merged = {**current, **changes}
    _ensure_dates_in_order(merged["startDate"], merged["endDate"])
    db.execute(
        "UPDATE projects SET name = ?, client = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?",
        (merged["name"], merged["client"], merged["status"], merged["startDate"], merged["endDate"], project_id),
    )
    return _fetch(db, project_id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Db) -> Response:
    """Borra el proyecto; su equipo queda sin proyecto y disponible (una persona ocupada sin proyecto sería incoherente)."""
    _fetch(db, project_id)
    db.execute("UPDATE users SET project_id = NULL, available = 1 WHERE project_id = ?", (project_id,))
    db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
