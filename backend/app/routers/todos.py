"""Recurso /todos (tareas). Compatible con el de JSONPlaceholder, pero con los cambios guardados."""

import sqlite3
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from ..db import get_db, now_iso
from ..schemas import TodoCreate, TodoIn, TodoOut, TodoPatch

router = APIRouter(prefix="/todos", tags=["todos"])

# scope="function": la conexión se cierra (y se hace el commit) ANTES de enviar la respuesta.
# Sin esto, FastAPI confirma los cambios después de responder y un cliente rápido que lee
# justo tras escribir vería datos antiguos.
Db = Annotated[sqlite3.Connection, Depends(get_db, scope="function")]


def _to_todo(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "title": row["title"],
        "completed": bool(row["completed"]),
        "createdAt": row["created_at"],
    }


def _fetch(db: sqlite3.Connection, todo_id: int) -> dict[str, Any]:
    row = db.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Tarea {todo_id} no encontrada")
    return _to_todo(row)


def _ensure_user_exists(db: sqlite3.Connection, user_id: int) -> None:
    """Una tarea no puede asignarse a un usuario que no existe. La base de datos ya lo impide con
    una clave foránea; esta comprobación previa da un 422 con un mensaje claro en lugar de un 500."""
    if db.execute("SELECT 1 FROM users WHERE id = ?", (user_id,)).fetchone() is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, f"El usuario {user_id} no existe"
        )


@router.get("", response_model=list[TodoOut])
def list_todos(
    response: Response,
    db: Db,
    user_id: Annotated[int | None, Query(alias="userId", ge=1)] = None,
    completed: bool | None = None,
    q: Annotated[str | None, Query(description="Busca en el título")] = None,
    page: Annotated[int | None, Query(alias="_page", ge=1)] = None,
    limit: Annotated[int | None, Query(alias="_limit", ge=1, le=200)] = None,
) -> list[dict[str, Any]]:
    """Lista tareas, filtrando opcionalmente por `userId`, `completed` y `q`. Con `_page` y
    `_limit` pagina; `X-Total-Count` indica el total (ya filtrado, antes de paginar). Sin
    `_limit` devuelve todas."""
    conditions: list[str] = []
    params: list[Any] = []
    if user_id is not None:
        conditions.append("user_id = ?")
        params.append(user_id)
    if completed is not None:
        conditions.append("completed = ?")
        params.append(int(completed))
    if q and q.strip():
        conditions.append("title LIKE ?")
        params.append(f"%{q.strip()}%")
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = db.execute(f"SELECT COUNT(*) FROM todos {where}", params).fetchone()[0]
    response.headers["X-Total-Count"] = str(total)

    sql = f"SELECT * FROM todos {where} ORDER BY id"
    if limit is not None:
        sql += " LIMIT ? OFFSET ?"
        params = [*params, limit, ((page or 1) - 1) * limit]
    return [_to_todo(row) for row in db.execute(sql, params).fetchall()]


@router.get("/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: int, db: Db) -> dict[str, Any]:
    return _fetch(db, todo_id)


@router.post("", response_model=TodoOut, status_code=status.HTTP_201_CREATED)
def create_todo(body: TodoCreate, db: Db) -> dict[str, Any]:
    """Crea una tarea. El id y la fecha de creación los asigna el servidor, salvo que se envíen:
    entonces se respetan (el id solo si está libre; si no, 409). Es lo que permite **restaurar**
    una tarea borrada exactamente como era."""
    _ensure_user_exists(db, body.userId)
    if body.id is not None and db.execute("SELECT 1 FROM todos WHERE id = ?", (body.id,)).fetchone():
        raise HTTPException(status.HTTP_409_CONFLICT, f"El id {body.id} ya está en uso")
    cursor = db.execute(
        "INSERT INTO todos (id, user_id, title, completed, created_at) "
        "VALUES (:id, :user_id, :title, :completed, :created_at)",
        {
            "id": body.id,
            "user_id": body.userId,
            "title": body.title,
            "completed": int(body.completed),
            "created_at": body.createdAt or now_iso(),
        },
    )
    return _fetch(db, cursor.lastrowid)


@router.put("/{todo_id}", response_model=TodoOut)
def replace_todo(todo_id: int, body: TodoIn, db: Db) -> dict[str, Any]:
    """Sustituye la tarea. La fecha de creación no cambia nunca (la gestiona el servidor), así que
    si el cuerpo incluye `createdAt` se ignora."""
    _fetch(db, todo_id)
    _ensure_user_exists(db, body.userId)
    db.execute(
        "UPDATE todos SET user_id = ?, title = ?, completed = ? WHERE id = ?",
        (body.userId, body.title, int(body.completed), todo_id),
    )
    return _fetch(db, todo_id)


@router.patch("/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, body: TodoPatch, db: Db) -> dict[str, Any]:
    """Cambia solo los campos enviados."""
    current = _fetch(db, todo_id)
    changes = body.model_dump(exclude_unset=True)
    if "userId" in changes:
        if changes["userId"] is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, "El campo 'userId' no puede ser nulo"
            )
        _ensure_user_exists(db, changes["userId"])
    for field in ("title", "completed"):
        if field in changes and changes[field] is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, f"El campo '{field}' no puede ser nulo"
            )
    merged = {**current, **changes}
    db.execute(
        "UPDATE todos SET user_id = ?, title = ?, completed = ? WHERE id = ?",
        (merged["userId"], merged["title"], int(merged["completed"]), todo_id),
    )
    return _fetch(db, todo_id)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Db) -> Response:
    _fetch(db, todo_id)
    db.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
