"""Esquemas (validación y forma de las respuestas). Imitan el formato de JSONPlaceholder."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints

Text120 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
# Comprobación de formato básica (sin dependencias extra); la validación completa de un
# email no se puede hacer solo con una expresión regular.
Email = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    ),
]
Short = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]


class Geo(BaseModel):
    lat: str | None = None
    lng: str | None = None


class Address(BaseModel):
    street: Short | None = None
    suite: Short | None = None
    city: Short | None = None
    zipcode: Short | None = None
    geo: Geo | None = None


class Company(BaseModel):
    name: Short | None = None
    catchPhrase: Short | None = None
    bs: Short | None = None


class UserIn(BaseModel):
    """Cuerpo de POST y PUT. `name` y `email` son obligatorios; el resto, opcional."""

    name: Text120
    username: Short | None = None
    email: Email
    phone: Short | None = None
    website: Short | None = None
    address: Address | None = None
    company: Company | None = None


class UserPatch(BaseModel):
    """Cuerpo de PATCH: todos los campos son opcionales y solo se cambian los enviados."""

    name: Text120 | None = None
    username: Short | None = None
    email: Email | None = None
    phone: Short | None = None
    website: Short | None = None
    address: Address | None = None
    company: Company | None = None


class UserCreate(UserIn):
    """Cuerpo de POST. El `id` es opcional: si no se envía lo asigna el servidor; si se envía
    (p. ej. para restaurar un usuario borrado) se usa, siempre que no esté ya ocupado."""

    id: Annotated[int, Field(ge=1)] | None = None


class UserOut(UserIn):
    id: int


# --- Tareas (/todos) ---------------------------------------------------------------------

# Mismas reglas que los formularios del Lab 10: de 3 a 120 caracteres y no en blanco.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
# Fecha ISO 8601 en UTC, el formato de `Date.toISOString()` de JavaScript.
IsoDate = Annotated[
    str, StringConstraints(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$")
]


# Prioridad de la tarea. En PUT, si el cuerpo no la incluye se conserva la actual (clientes anteriores).
Priority = Literal["high", "medium", "low"]


class TodoIn(BaseModel):
    """Cuerpo de PUT: tarea completa. Cualquier campo extra (p. ej. `createdAt`) se ignora."""

    userId: Annotated[int, Field(ge=1)]
    title: Title
    completed: bool = False
    priority: Priority = "medium"


class TodoPatch(BaseModel):
    userId: Annotated[int, Field(ge=1)] | None = None
    title: Title | None = None
    completed: bool | None = None
    priority: Priority | None = None


class TodoCreate(TodoIn):
    """Cuerpo de POST. `id` y `createdAt` son opcionales: el servidor los asigna si faltan, y
    si se envían se respetan (así se puede restaurar una tarea borrada tal como era)."""

    id: Annotated[int, Field(ge=1)] | None = None
    createdAt: IsoDate | None = None


class TodoOut(TodoIn):
    id: int
    createdAt: str
