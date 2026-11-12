"""Esquemas (validación y forma de las respuestas). Imitan el formato de JSONPlaceholder."""

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator, model_validator

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
# Día ISO (AAAA-MM-DD). Un día debe existir de verdad (no vale 2026-02-30): lo comprueba `check_day`.
IsoDay = Annotated[str, StringConstraints(pattern=r"^\d{4}-\d{2}-\d{2}$")]


def check_day(value: str | None) -> str | None:
    """Un día ISO debe existir de verdad (no vale 2026-02-30)."""
    if value is not None:
        date.fromisoformat(value)
    return value


# Datos de empleado de un usuario (TalentHub). Los clientes anteriores no los envían: en POST toman su valor por defecto
# y en PUT se conserva el que ya hubiera; para quitar el proyecto o la fecha hay que enviarlos vacíos (`null`).
Role = Literal["desarrollador", "diseñador", "qa", "devops", "manager"]
SkillLevel = Literal["junior", "mid", "senior"]


class Skill(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)]
    level: SkillLevel


Skills = Annotated[list[Skill], Field(max_length=20)]
PositiveId = Annotated[int, Field(ge=1)]
EMPLOYEE_FIELDS = ("role", "skills", "available", "projectId", "hiredAt")
BUSY_WITHOUT_PROJECT = "Un empleado que no está disponible debe tener un proyecto asignado"


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
    role: Role = "desarrollador"
    skills: Skills = []
    available: bool = True
    projectId: PositiveId | None = None
    hiredAt: IsoDay | None = None

    @field_validator("hiredAt")
    @classmethod
    def _real_day(cls, value: str | None) -> str | None:
        return check_day(value)


class UserPatch(BaseModel):
    """Cuerpo de PATCH: todos los campos son opcionales y solo se cambian los enviados."""

    name: Text120 | None = None
    username: Short | None = None
    email: Email | None = None
    phone: Short | None = None
    website: Short | None = None
    address: Address | None = None
    company: Company | None = None
    role: Role | None = None
    skills: Skills | None = None
    available: bool | None = None
    projectId: PositiveId | None = None
    hiredAt: IsoDay | None = None

    @field_validator("hiredAt")
    @classmethod
    def _real_day(cls, value: str | None) -> str | None:
        return check_day(value)


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

# Planificación opcional de la tarea: descripción, fechas (día ISO, AAAA-MM-DD) y etiquetas. Igual que la
# prioridad, en PUT lo que el cuerpo no incluya se conserva; para borrarlo hay que enviarlo vacío (`null`, `[]`).
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]
Tag = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Tags = Annotated[list[Tag], Field(max_length=20)]

END_BEFORE_START = "La fecha de fin no puede ser anterior a la de inicio"


def end_before_start(start: str | None, end: str | None) -> bool:
    return start is not None and end is not None and end < start  # los días ISO se ordenan como texto


class TodoIn(BaseModel):
    """Cuerpo de PUT: tarea completa. Cualquier campo extra (p. ej. `createdAt`) se ignora."""

    userId: Annotated[int, Field(ge=1)]
    title: Title
    completed: bool = False
    priority: Priority = "medium"
    description: Description | None = None
    startDate: IsoDay | None = None
    endDate: IsoDay | None = None
    tags: Tags = []

    @field_validator("startDate", "endDate")
    @classmethod
    def _real_day(cls, value: str | None) -> str | None:
        return check_day(value)

    @field_validator("description")
    @classmethod
    def _blank_is_none(cls, value: str | None) -> str | None:
        return value or None

    @model_validator(mode="after")
    def _dates_in_order(self) -> "TodoIn":
        if end_before_start(self.startDate, self.endDate):
            raise ValueError(END_BEFORE_START)
        return self


class TodoPatch(BaseModel):
    userId: Annotated[int, Field(ge=1)] | None = None
    title: Title | None = None
    completed: bool | None = None
    priority: Priority | None = None
    description: Description | None = None
    startDate: IsoDay | None = None
    endDate: IsoDay | None = None
    tags: Tags | None = None

    @field_validator("startDate", "endDate")
    @classmethod
    def _real_day(cls, value: str | None) -> str | None:
        return check_day(value)

    @field_validator("description")
    @classmethod
    def _blank_is_none(cls, value: str | None) -> str | None:
        return value or None


class TodoCreate(TodoIn):
    """Cuerpo de POST. `id` y `createdAt` son opcionales: el servidor los asigna si faltan, y
    si se envían se respetan (así se puede restaurar una tarea borrada tal como era)."""

    id: Annotated[int, Field(ge=1)] | None = None
    createdAt: IsoDate | None = None


class TodoOut(TodoIn):
    id: int
    createdAt: str


# --- Proyectos (/projects) ---------------------------------------------------------------

ProjectStatus = Literal["active", "paused", "completed"]
ProjectName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]


class ProjectIn(BaseModel):
    """Cuerpo de POST y PUT. `name` y `client` son obligatorios. `status` (por defecto 'active'), `startDate` (por
    defecto, hoy) y `endDate` son opcionales; en PUT, lo que el cuerpo no incluya se conserva."""

    name: ProjectName
    client: Text120
    status: ProjectStatus = "active"
    startDate: IsoDay | None = None
    endDate: IsoDay | None = None

    @field_validator("startDate", "endDate")
    @classmethod
    def _real_day(cls, value: str | None) -> str | None:
        return check_day(value)

    @model_validator(mode="after")
    def _dates_in_order(self) -> "ProjectIn":
        if end_before_start(self.startDate, self.endDate):
            raise ValueError(END_BEFORE_START)
        return self


class ProjectPatch(BaseModel):
    name: ProjectName | None = None
    client: Text120 | None = None
    status: ProjectStatus | None = None
    startDate: IsoDay | None = None
    endDate: IsoDay | None = None

    @field_validator("startDate", "endDate")
    @classmethod
    def _real_day(cls, value: str | None) -> str | None:
        return check_day(value)


class ProjectCreate(ProjectIn):
    """Cuerpo de POST. El `id` es opcional: si se envía (p. ej. para restaurar un proyecto) se usa, si está libre."""

    id: PositiveId | None = None


class ProjectOut(BaseModel):
    id: int
    name: str
    client: str
    status: ProjectStatus
    startDate: str
    endDate: str | None
    memberIds: list[int]  # los empleados asignados al proyecto (su equipo), según `users.projectId`
