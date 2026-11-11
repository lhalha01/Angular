# Curso de Angular: laboratorios

Repositorio con las prácticas del curso de Angular, organizado por niveles. Cada laboratorio vive en su
carpeta `Lab NN`, con su enunciado (`Lab NN.md`) y, cuando corresponde, el proyecto Angular que lo resuelve.

## Estructura del repositorio

```text
.
├── 1-Basico/          Lab 01 a Lab 09, más las prácticas finales Lab 10 y Lab 10.1
├── 2-Intermedio/      Lab 11 a Lab 19, más las prácticas finales Lab 20 y Lab 20.1
├── 3-Avanzado/        Lab 21 a Lab 28, más la práctica final Lab 29
└── backend/           APIs locales (FastAPI + SQLite) que sustituyen a las públicas y guardan los cambios
```

| Nivel | Carpeta | Laboratorios | Práctica final | Estado |
| --- | --- | --- | --- | --- |
| Básico | `1-Basico` | Lab 01 a Lab 09 | Lab 10 y Lab 10.1 | Completado |
| Intermedio | `2-Intermedio` | Lab 11 a Lab 19 | Lab 20 y Lab 20.1 | En curso: Lab 11.1, 11.2, 12.1, 12.2, 13.1, 13.2, 14.1, 14.2, 15.1 y 15.2 hechos |
| Avanzado | `3-Avanzado` | Lab 21 a Lab 28 | Lab 29 | Pendiente (enunciados por añadir) |

## Proyectos del nivel Básico

| Laboratorio | Proyecto | Contenido |
| --- | --- | --- |
| Lab 01 | `1-Basico/Lab 01/helloWorld` | Primera aplicación |
| Lab 02 | `1-Basico/Lab 02/debugApp` | Depuración |
| Lab 03 | `1-Basico/Lab 03/welcomeApp` | Componentes |
| Lab 04 | `1-Basico/Lab 04/routerApp` | Router |
| Lab 05 | `1-Basico/Lab 05/directivesApp` | Directivas |
| Lab 06 | `1-Basico/Lab 06/dataBindingsApp` | Data binding |
| Lab 07 | `1-Basico/Lab 07/pipesApp` | Pipes |
| Lab 08 | `1-Basico/Lab 08/productsApp` | Servicios |
| Lab 09 | `1-Basico/Lab 09/lifecycleApp` | Ciclo de vida |
| Lab 10 | `1-Basico/Lab 10/lab-10-app` | **Práctica final:** Gestor de Tareas |
| Lab 10.1 | `1-Basico/Lab 10.1/userManagerApp` | **Práctica final:** Gestor de Usuarios |

Cada laboratorio parte del código del anterior (cabecera, rutas y componentes acumulados).

## Proyectos del nivel Intermedio

Los **Labs 11 y 12** reúnen cada uno dos laboratorios en un solo enunciado (`Lab 11.md` y `Lab 12.md`, que se
conservan tal cual): el itinerario de **TalentHub** (`.1`) y el de la aplicación de **tareas y usuarios** (`.2`). Se
dividen en dos carpetas, cada una con su propio enunciado extraído de él:

| Laboratorio | Proyecto | Contenido | Estado |
| --- | --- | --- | --- |
| Lab 10 (copia de trabajo) | `2-Intermedio/Lab 10/tareas` | **Intermedio:** copia del Gestor de Tareas que se modifica en los Labs 11 a 19 (comparte `node_modules` con el nivel) |
| Lab 11.1 | `2-Intermedio/Lab 11/Lab 11.1/talenthub` | TalentHub: modelos de dominio, DTOs, mappers y type guards | Hecho |
| Lab 11.2 | `2-Intermedio/Lab 11/Lab 11.2` | Tipado de la aplicación del Lab 10 (auditoría, modelos y type guards) | Hecho (versión adaptada) sobre la copia del Lab 10 en `2-Intermedio/Lab 10/tareas` |
| Lab 12.1 | `2-Intermedio/Lab 12/Lab 12.1/talenthub` | TalentHub: arquitectura por features (`core`, `shared`, `features`), barrels, alias de rutas y comprobación de arquitectura | Hecho |
| Lab 12.2 | `2-Intermedio/Lab 12/Lab 12.2` | Reestructurar la aplicación de tareas y usuarios por features | Hecho (versión adaptada) sobre la copia del Lab 10 de `2-Intermedio/Lab 10/tareas`: features `tareas` y `usuarios`, barrels y alias (véase el README de la app) |
| Lab 13.1 | `2-Intermedio/Lab 13/Lab 13.1/talenthub` | TalentHub: router profesional (rutas lazy por feature, `authGuard`, resolver del perfil, guard de cambios pendientes) | Hecho; usa el backend local (`/users`) |
| Lab 13.2 | `2-Intermedio/Lab 13/Lab 13.2` | Navegación segura de la aplicación de tareas (login, `authGuard`, rutas lazy) | Hecho sobre la copia del Lab 10 de `2-Intermedio/Lab 10/tareas` (véase su README) |
| Lab 14.1 | `2-Intermedio/Lab 14/Lab 14.1/talenthub` | TalentHub: HTTP y capa de datos (`EmpleadoService`, `ProyectoService`, interceptores, reintentos y avisos de error) | Hecho; usa el backend local (`/users` y `/todos`) |
| Lab 14.2 | `2-Intermedio/Lab 14/Lab 14.2` | Interceptores, DTO y mapper en la aplicación de tareas | Hecho sobre la copia del Lab 10 de `2-Intermedio/Lab 10/tareas` (dominio en inglés; véase su README) |
| Lab 15.1 | `2-Intermedio/Lab 15/Lab 15.1/talenthub` | TalentHub: directorio reactivo (búsqueda con `debounceTime` + `switchMap`, filtros combinados y alta con `exhaustMap`) | Hecho; usa el backend local (`/users?q=`) |
| Lab 15.2 | `2-Intermedio/Lab 15/Lab 15.2` | Búsqueda y filtros reactivos en la aplicación de tareas, con prioridad | Hecho sobre la copia del Lab 10 de `2-Intermedio/Lab 10/tareas`; añade el campo `priority` al backend (véase su README) |

## Estructura de dependencias

Hay dos tipos de proyecto, según cómo gestionan `node_modules`:

| Tipo | Proyectos | `node_modules` y `package-lock.json` |
| --- | --- | --- |
| **Compartidos** (npm workspaces) | Laboratorios normales de un nivel | Uno solo por nivel, en la carpeta del nivel |
| **Autónomos** | Prácticas finales: Lab 10, Lab 10.1, Lab 20, Lab 20.1 y Lab 29 | Propios, dentro de la carpeta de cada proyecto |

Los laboratorios normales de un nivel pueden compartir una única instalación para ahorrar espacio en disco.
Las prácticas finales son entregables, por lo que son independientes: se pueden copiar a otro repositorio y
funcionan con su propio `package.json` y `package-lock.json`.

Estado actual por nivel:

| Nivel | Dependencias |
| --- | --- |
| Básico (`1-Basico`) | Workspace propio: `1-Basico/package.json` con `workspaces: ["Lab 0*/*"]`, su lockfile y su `node_modules`, compartidos por Lab 01 a Lab 09. Lab 10 y Lab 10.1 quedan fuera del patrón y son autónomos. |
| Intermedio (`2-Intermedio`) | Workspace propio: `2-Intermedio/package.json` con `workspaces: ["Lab 1[1-9]/Lab 1[1-9].*/*", "Lab 1[1-9]/*"]`, su lockfile y su `node_modules`, compartidos por los Labs 11 a 19 (el primer patrón cubre los laboratorios partidos en `.1` y `.2`, que tienen un nivel más de carpetas). Lab 20 y Lab 20.1 quedan fuera del patrón y serán autónomos. |
| Avanzado (`3-Avanzado`) | **Sin workspace todavía**: solo contiene las carpetas de los labs con sus enunciados. |

No hay `package.json` en la raíz del repositorio.

## Backend (opcional en el Básico; obligatorio en el Intermedio)

Las prácticas usan por defecto APIs públicas de mentira (JSONPlaceholder), que no guardan los cambios.
La carpeta [`backend/`](backend/README.md) ofrece APIs locales con **FastAPI y SQLite** que sí los guardan, y
se arranca con un solo comando (`.\start.cmd` en Windows, `./start.sh` en Linux/macOS). Es opcional: nada
del resto del repositorio lo necesita para funcionar. Guía paso a paso: [`backend/GUIA.md`](backend/GUIA.md).

| Práctica | Usa el backend | Cómo |
| --- | --- | --- |
| Lab 10.1 | Sí (recurso `/users`) | `npm run start:local` |
| Lab 10 | Sí (recursos `/todos` y `/users`) | `npm run start:local` |
| Lab 10 del Intermedio (`2-Intermedio/Lab 10/tareas`) | **Siempre** (recursos `/todos` y `/users`) | `npm start`, con el backend arrancado; la API pública solo con `npm run start:public` |

**En el nivel Intermedio se usan siempre las APIs locales del backend.** Si un Lab necesitara un recurso o un campo que el backend no tiene, se plantea antes de crearlo.

## Requisitos

- **Node.js** 20.19 o superior y menor que 22 (requisito del curso).
- **npm** 10 o superior.
- **Chrome o Chromium**, solo para ejecutar los tests unitarios.
- **Python 3.11 o superior**, solo si se quiere usar el backend opcional.
- **Angular 20.3** (CLI 20.3.x), la versión fijada por el curso.

## Cómo ejecutar un proyecto

### Laboratorios compartidos (por ejemplo, Lab 01 a Lab 09)

```bash
# una sola vez por nivel, desde la carpeta del nivel
cd 1-Basico
npm install               # o npm ci, para instalar exactamente lo fijado en el lockfile

# arrancar un laboratorio
cd "Lab 05/directivesApp"
npm start                 # http://localhost:4200/
```

### Prácticas finales (autónomas)

```bash
cd "1-Basico/Lab 10/lab-10-app"   # o "1-Basico/Lab 10.1/userManagerApp"
npm install                       # o npm ci, para instalar exactamente lo fijado en el lockfile
npm start                         # http://localhost:4200/
```

Tests de un proyecto (necesitan Chrome o Chromium):

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Si el puerto 4200 está ocupado, se puede elegir otro: `npx ng serve --port 4201`.

## Cómo crear un laboratorio nuevo

### Laboratorio en un nivel con workspace (por ejemplo, el nivel Básico)

```bash
cd "1-Basico/Lab 05"
npx -p @angular/cli@20 ng new miApp --routing --style=scss --ssr=false --zoneless=false \
    --skip-git --skip-install --ai-config=none --package-manager=npm
# desde la carpeta del nivel:
cd .. && npm install
```

Si el nivel aún no tiene workspace (Avanzado), hay que decidir antes si lo tendrá: en ese caso se
crea un `package.json` en la carpeta del nivel con el campo `workspaces` (se puede partir del de
`1-Basico/package.json`) y el patrón de sus labs normales, de forma que las prácticas finales queden fuera.

### Práctica final autónoma

```bash
cd "2-Intermedio/Lab 20"
npx -p @angular/cli@20 ng new miApp --routing --style=scss --ssr=false --zoneless=false \
    --skip-git --ai-config=none --package-manager=npm
```

Sin `--skip-install`: la práctica instala sus propias dependencias y genera su `package-lock.json`.
Hay que confirmar que su carpeta **no** coincide con ningún patrón de `workspaces`.

## Calidad y seguridad de dependencias

Las prácticas finales documentan en su propio `README.md` la revisión de integridad
(`npm audit signatures`), la de vulnerabilidades (`npm audit`) y las versiones utilizadas.
Resumen a fecha de 2026-11-11:

| Práctica | Firmas verificadas | Vulnerabilidades en producción | Vulnerabilidades totales |
| --- | --- | --- | --- |
| Lab 10 | 941 | 0 | 21 moderadas (herramientas de desarrollo) |
| Lab 10.1 | 541 | 0 | 16 moderadas (herramientas de desarrollo) |

Todas las entradas de los `package-lock.json` llevan hash de integridad y proceden del registro de npm.

**Backend (Python):** `requirements.txt` fija todas las versiones; `pip check` no encuentra conflictos y
`pip-audit` no encuentra vulnerabilidades conocidas. Detalle en [`backend/README.md`](backend/README.md).

## Notas

- `node_modules/`, `dist/` y `.angular/` no se versionan (véase `.gitignore`).
- Del backend sí se versiona la base de datos de ejemplo `backend/data/app.db`, para que quien clone tenga datos;
  cambia cuando se usa el backend (véase "La base de datos en git" en [`backend/README.md`](backend/README.md)).
- Angular 21 admite Node 20.19 y sería la siguiente migración posible; Angular 22 exige Node 22.22 o
  superior, incompatible con el requisito del curso.
