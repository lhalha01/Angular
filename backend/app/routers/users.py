"""Recurso /users. Compatible con el de JSONPlaceholder, pero con los cambios guardados."""

import json
import sqlite3
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from ..db import get_db
from ..schemas import UserCreate, UserIn, UserOut, UserPatch

router = APIRouter(prefix="/users", tags=["users"])

# scope="function": la conexión se cierra (y se hace el commit) ANTES de enviar la respuesta.
# Sin esto, FastAPI confirma los cambios después de responder y un cliente rápido que lee
# justo tras escribir vería datos antiguos.
Db = Annotated[sqlite3.Connection, Depends(get_db, scope="function")]


def _to_user(row: sqlite3.Row) -> dict[str, Any]:
    user = dict(row)
    user["address"] = json.loads(user["address"]) if user["address"] else None
    user["company"] = json.loads(user["company"]) if user["company"] else None
    return user


def _fetch(db: sqlite3.Connection, user_id: int) -> dict[str, Any]:
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Usuario {user_id} no encontrado")
    return _to_user(row)


def _columns(data: dict[str, Any]) -> dict[str, Any]:
    """Prepara un usuario para guardarlo: address y company se almacenan como JSON."""
    return {
        **data,
        "address": json.dumps(data.get("address")),
        "company": json.dumps(data.get("company")),
    }


@router.get("", response_model=list[UserOut])
def list_users(
    response: Response,
    db: Db,
    q: Annotated[str | None, Query(description="Busca en nombre, usuario y email")] = None,
    page: Annotated[int | None, Query(alias="_page", ge=1)] = None,
    limit: Annotated[int | None, Query(alias="_limit", ge=1, le=100)] = None,
) -> list[dict[str, Any]]:
    """Lista usuarios. Con `_page` y `_limit` pagina; `X-Total-Count` indica el total
    (antes de paginar), igual que hace JSONPlaceholder."""
    where, params = "", []
    if q and q.strip():
        where = "WHERE name LIKE ? OR username LIKE ? OR email LIKE ?"
        params = [f"%{q.strip()}%"] * 3

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


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Db) -> dict[str, Any]:
    """Crea un usuario. El id lo asigna el servidor (a diferencia de JSONPlaceholder, que
    responde siempre con el mismo id), salvo que se envíe uno: entonces se usa si está libre
    y, si no, responde 409. Sirve para restaurar un usuario borrado con su mismo id."""
    if body.id is not None and db.execute("SELECT 1 FROM users WHERE id = ?", (body.id,)).fetchone():
        raise HTTPException(status.HTTP_409_CONFLICT, f"El id {body.id} ya está en uso")
    cursor = db.execute(
        "INSERT INTO users (id, name, username, email, phone, website, address, company) "
        "VALUES (:id, :name, :username, :email, :phone, :website, :address, :company)",
        _columns(body.model_dump()),
    )
    return _fetch(db, cursor.lastrowid)


@router.put("/{user_id}", response_model=UserOut)
def replace_user(user_id: int, body: UserIn, db: Db) -> dict[str, Any]:
    """Sustituye el usuario completo: los campos opcionales no enviados quedan vacíos."""
    _fetch(db, user_id)
    db.execute(
        "UPDATE users SET name=:name, username=:username, email=:email, phone=:phone, "
        "website=:website, address=:address, company=:company WHERE id=:id",
        {**_columns(body.model_dump()), "id": user_id},
    )
    return _fetch(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserPatch, db: Db) -> dict[str, Any]:
    """Actualiza solo los campos enviados. `address` y `company` se combinan con los
    existentes (si se envía solo `address.city`, el resto de la dirección se conserva)."""
    current = _fetch(db, user_id)
    # `exclude_unset` deja fuera lo que no se envió, también dentro de address y company.
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is None and field in ("name", "email"):
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, f"El campo '{field}' no puede ser nulo"
            )
        if field in ("address", "company") and isinstance(value, dict):
            current[field] = {**(current.get(field) or {}), **value}
        else:
            current[field] = value
    db.execute(
        "UPDATE users SET name=:name, username=:username, email=:email, phone=:phone, "
        "website=:website, address=:address, company=:company WHERE id=:id",
        _columns(current),
    )
    return _fetch(db, user_id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Db) -> Response:
    _fetch(db, user_id)
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
