"""Recurso /users. Compatible con el de JSONPlaceholder, pero con los cambios guardados.

Desde el esquema 5 un usuario es también un **empleado** (TalentHub): `role`, `skills`, `available`, `projectId` y
`hiredAt`. Son opcionales: los clientes anteriores (Lab 10 y 10.1) no los envían y todo sigue funcionando.
"""

import json
import sqlite3
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from ..db import get_db
from ..schemas import (
    BUSY_WITHOUT_PROJECT,
    EMPLOYEE_FIELDS,
    Role,
    UserCreate,
    UserIn,
    UserOut,
    UserPatch,
)

router = APIRouter(prefix="/users", tags=["users"])

# scope="function": la conexión se cierra (y se hace el commit) ANTES de enviar la respuesta.
# Sin esto, FastAPI confirma los cambios después de responder y un cliente rápido que lee
# justo tras escribir vería datos antiguos.
Db = Annotated[sqlite3.Connection, Depends(get_db, scope="function")]

BASE_FIELDS = ("name", "username", "email", "phone", "website")


def _to_user(row: sqlite3.Row) -> dict[str, Any]:
    user = {key: row[key] for key in ("id", *BASE_FIELDS)}
    user["address"] = json.loads(row["address"]) if row["address"] else None
    user["company"] = json.loads(row["company"]) if row["company"] else None
    user["role"] = row["role"]
    user["skills"] = json.loads(row["skills"])
    user["available"] = bool(row["available"])
    user["projectId"] = row["project_id"]
    user["hiredAt"] = row["hired_at"]
    return user


def _fetch(db: sqlite3.Connection, user_id: int) -> dict[str, Any]:
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Usuario {user_id} no encontrado")
    return _to_user(row)


def _columns(data: dict[str, Any]) -> dict[str, Any]:
    """Prepara un usuario para guardarlo: address, company y skills se almacenan como JSON."""
    return {
        **{key: data.get(key) for key in BASE_FIELDS},
        "id": data.get("id"),
        "address": json.dumps(data.get("address")),
        "company": json.dumps(data.get("company")),
        "role": data["role"],
        "skills": json.dumps(data["skills"], ensure_ascii=False),
        "available": int(data["available"]),
        "project_id": data["projectId"],
        "hired_at": data["hiredAt"],
    }


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _ensure_assignment(db: sqlite3.Connection, available: bool, project_id: int | None) -> None:
    """El proyecto debe existir, y quien no está disponible debe tener uno (la misma regla del formulario de alta)."""
    if project_id is not None and db.execute("SELECT 1 FROM projects WHERE id = ?", (project_id,)).fetchone() is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"El proyecto {project_id} no existe")
    if not available and project_id is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, BUSY_WITHOUT_PROJECT)


@router.get("", response_model=list[UserOut])
def list_users(
    response: Response,
    db: Db,
    q: Annotated[str | None, Query(description="Busca en nombre, usuario y email")] = None,
    role: Role | None = None,
    available: bool | None = None,
    project_id: Annotated[int | None, Query(alias="projectId", ge=1, description="Solo el equipo de ese proyecto")] = None,
    page: Annotated[int | None, Query(alias="_page", ge=1)] = None,
    limit: Annotated[int | None, Query(alias="_limit", ge=1, le=100)] = None,
) -> list[dict[str, Any]]:
    """Lista usuarios, filtrando opcionalmente por `q`, `role`, `available` y `projectId`. Con `_page` y `_limit`
    pagina; `X-Total-Count` indica el total (ya filtrado, antes de paginar), igual que hace JSONPlaceholder."""
    conditions: list[str] = []
    params: list[Any] = []
    if q and q.strip():
        conditions.append("(name LIKE ? OR username LIKE ? OR email LIKE ?)")
        params += [f"%{q.strip()}%"] * 3
    if role is not None:
        conditions.append("role = ?")
        params.append(role)
    if available is not None:
        conditions.append("available = ?")
        params.append(int(available))
    if project_id is not None:
        conditions.append("project_id = ?")
        params.append(project_id)
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = db.execute(f"SELECT COUNT(*) FROM users {where}", params).fetchone()[0]
    response.headers["X-Total-Count"] = str(total)

    sql = f"SELECT * FROM users {where} ORDER BY id"
    if limit is not None:
        sql += " LIMIT ? OFFSET ?"
        params = [*params, limit, ((page or 1) - 1) * limit]
    return [_to_user(row) for row in db.execute(sql, params).fetchall()]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Db) -> dict[str, Any]:
    return _fetch(db, user_id)


_INSERT = (
    "INSERT INTO users (id, name, username, email, phone, website, address, company, "
    "role, skills, available, project_id, hired_at) "
    "VALUES (:id, :name, :username, :email, :phone, :website, :address, :company, "
    ":role, :skills, :available, :project_id, :hired_at)"
)
_UPDATE = (
    "UPDATE users SET name=:name, username=:username, email=:email, phone=:phone, "
    "website=:website, address=:address, company=:company, role=:role, skills=:skills, "
    "available=:available, project_id=:project_id, hired_at=:hired_at WHERE id=:id"
)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Db) -> dict[str, Any]:
    """Crea un usuario. El id lo asigna el servidor (a diferencia de JSONPlaceholder, que
    responde siempre con el mismo id), salvo que se envíe uno: entonces se usa si está libre
    y, si no, responde 409. Sirve para restaurar un usuario borrado con su mismo id.

    Los datos de empleado son opcionales: sin ellos queda como desarrollador disponible, sin proyecto ni
    habilidades y con la fecha de incorporación de hoy. Si no está disponible, debe indicar su proyecto."""
    if body.id is not None and db.execute("SELECT 1 FROM users WHERE id = ?", (body.id,)).fetchone():
        raise HTTPException(status.HTTP_409_CONFLICT, f"El id {body.id} ya está en uso")
    _ensure_assignment(db, body.available, body.projectId)
    data = body.model_dump()
    data["hiredAt"] = data["hiredAt"] or _today()
    cursor = db.execute(_INSERT, _columns(data))
    return _fetch(db, cursor.lastrowid)


@router.put("/{user_id}", response_model=UserOut)
def replace_user(user_id: int, body: UserIn, db: Db) -> dict[str, Any]:
    """Sustituye el usuario completo: los campos opcionales no enviados quedan vacíos. Los datos de empleado
    (`role`, `skills`, `available`, `projectId`, `hiredAt`) que el cuerpo no incluya se **conservan** (así un cliente
    anterior a esos campos no los reinicia al guardar); para borrar el proyecto o la fecha hay que enviarlos `null`."""
    current = _fetch(db, user_id)
    data = body.model_dump()
    for field in EMPLOYEE_FIELDS:
        if field not in body.model_fields_set:
            data[field] = current[field]
    _ensure_assignment(db, data["available"], data["projectId"])
    db.execute(_UPDATE, {**_columns(data), "id": user_id})
    return _fetch(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserPatch, db: Db) -> dict[str, Any]:
    """Actualiza solo los campos enviados. `address` y `company` se combinan con los
    existentes (si se envía solo `address.city`, el resto de la dirección se conserva)."""
    current = _fetch(db, user_id)
    # `exclude_unset` deja fuera lo que no se envió, también dentro de address y company.
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is None and field in ("name", "email", "role", "skills", "available"):
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, f"El campo '{field}' no puede ser nulo"
            )
        if field in ("address", "company") and isinstance(value, dict):
            current[field] = {**(current.get(field) or {}), **value}
        else:
            current[field] = value
    _ensure_assignment(db, current["available"], current["projectId"])
    db.execute(_UPDATE, {**_columns(current), "id": user_id})
    return _fetch(db, user_id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Db) -> Response:
    _fetch(db, user_id)
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
