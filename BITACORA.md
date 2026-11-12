# Bitácora del curso de Angular — cierre de los niveles Básico e Intermedio

Documento de traspaso. Está escrito para que **cualquier persona (o agente) pueda abordar el nivel Avanzado más adelante sin
perder contexto**: qué hay hecho, cómo está montado, qué reglas fijó el usuario, qué trampas se encontraron y qué queda por decidir.
Complementa al [`README.md`](./README.md) (que es el índice del repositorio) y a los `README.md` / `DECISION_LOG.md` de cada proyecto.

- **Repositorio:** `lhalha01/Angular`, rama `main` (se trabaja y se sube directamente a `main`; no hay ramas por lab).
- **Cierre de esta bitácora:** 2026-11-12, último commit `00724fc`. Árbol de trabajo limpio.
- **Idioma:** todo (código de dominio de TalentHub, documentación, commits) en español; el dominio de la app de tareas, en inglés (ver §5).

---

## 1. Estado de un vistazo

| Nivel | Carpeta | Estado | Qué contiene |
| --- | --- | --- | --- |
| Básico | `1-Basico` | **Cerrado** | Labs 01–09 y las prácticas finales Lab 10 (tareas) y Lab 10.1 (usuarios) |
| Intermedio | `2-Intermedio` | **Cerrado** | Labs 11–19 en dos mitades (`.1` TalentHub, `.2` app de tareas/usuarios), Lab 20 (TalentHub final) y Lab 20.1 (refactor de TalentHub) |
| Avanzado | `3-Avanzado` | **Sin empezar** | Solo `Lab 21`…`Lab 29` con su enunciado (`Lab NN.md`); no hay proyectos ni `package.json` |
| Backend | `backend/` | Estable (esquema v5) | FastAPI + SQLite con `/users`, `/todos`, `/projects` |

Todo lo hecho está subido. Lo único fuera de lo normal: `backend/data/app.db` se subió **una vez, a petición expresa** con los datos de
las pruebas; no se sube por defecto (ver §5).

### Cifras finales de referencia (comprobadas con ejecuciones reales)

| Proyecto | Pruebas | Notas |
| --- | --- | --- |
| `backend/` | 232 (pytest) | incluye migración v5 y servidor real con concurrencia |
| `2-Intermedio/Lab 20/talenthub` | 322, 100 % de líneas | `ng lint` 0, 17 componentes OnPush, bundle inicial 319,62 kB |
| `2-Intermedio/Lab 19/Lab 19.1/talenthub` | 271 | misma capa de datos que el Lab 20 |
| `2-Intermedio/Lab 20.1/talenthub` | 322 | refactor: deuda 82→0, lint 42→0, arquitectura 24→0 (ver su `AUDIT.md`) |
| `1-Basico/Lab 10/lab-10-app` | 225 | |
| `1-Basico/Lab 10.1/userManagerApp` | 53 | |

---

## 2. Estructura del repositorio y gestión de dependencias

```text
.
├── README.md        índice del repo (estructura, tablas de proyectos por nivel, cómo arrancar)
├── BITACORA.md      este documento
├── 1-Basico/        package.json con workspaces ["Lab 0*/*"]  → Labs 01–09 comparten un node_modules
│                    (Lab 10 y Lab 10.1 son AUTÓNOMOS: su propio package.json, lock y node_modules)
├── 2-Intermedio/    package.json con workspaces ["Lab 1[0-9]/Lab 1[0-9].*/*", "Lab 1[0-9]/*"]
│                    → Lab 10/tareas y los Labs 11–19 comparten un node_modules
│                    (Lab 20 y Lab 20.1 son AUTÓNOMOS, fuera del workspace)
├── 3-Avanzado/      sin package.json todavía; solo Lab 21 … Lab 29 con su .md
└── backend/         FastAPI + SQLite (app/, tests/, data/app.db, start.cmd / start.sh)
```

Convenciones que se han mantenido y conviene respetar:

1. **Una carpeta `Lab NN` por práctica** con su enunciado `Lab NN.md`; cuando un enunciado trae dos mitades se parte en `Lab NN.1` y `Lab NN.2`
   y el original **se conserva intacto**.
2. **Cada lab parte del código del anterior**: se copia el proyecto con un nombre de paquete único (`talenthub-lab-NN`, porque los workspaces
   de npm no admiten nombres repetidos) y se sigue sobre la copia.
3. **Las prácticas finales (10, 10.1, 20, 20.1 y, previsiblemente, 29) son entregables autónomos**: se instalan sin workspace
   (`npm install` en su carpeta; `node_modules` y `package-lock.json` propios).
4. En un nivel con workspace: `ng new <nombre> --skip-install` dentro de `Lab NN` y `npm install` en la carpeta del nivel. En una final
   autónoma: `ng new` normal.
5. **El disco C: suele estar justo**: comprobar el espacio antes de instalar; es el motivo de compartir `node_modules` por nivel.
6. `.gitignore` ya excluye `node_modules/`, `dist/`, `.angular/` y los ficheros de auditoría sueltos.

### Dónde está cada cosa del Intermedio

| Laboratorio | Proyecto |
| --- | --- |
| Copia de trabajo del Lab 10 (todos los `.2`) | `2-Intermedio/Lab 10/tareas` |
| TalentHub, una copia por lab | `2-Intermedio/Lab NN/Lab NN.1/talenthub` (NN = 11…19) |
| Aplicación de tareas, acumulada | los `Lab NN.2` se hicieron sobre `Lab 10/tareas` (cada uno con su README y evidencias) |
| Práctica final TalentHub | `2-Intermedio/Lab 20/talenthub` (+ `DECISION_LOG.md`, `README.md`, `evidencias/`) |
| Refactor guiado por métricas | `2-Intermedio/Lab 20.1/` → `base/` (con deuda), `talenthub/` (refactorizado), `evidencias/` |

El **briefing de TalentHub** (portal interno de «Nexus Digital Solutions») está en `2-Intermedio/Lab 20/Lab 20.md`.

---

## 3. Entorno y cómo arrancar

| Elemento | Versión / valor |
| --- | --- |
| Angular | **20.3.35** (CLI 20.3.42). El curso fija la línea 20; Angular 21 es compatible con Node 20.19, Angular 22 exige Node ≥ 22.22 |
| Node | ≥ 20.19 y < 22 (en la máquina: 20.20.1) |
| TypeScript / RxJS / Zone.js | 5.9 / 7.8 / 0.15 |
| Lint | ESLint 9 + angular-eslint 20.7.0 + typescript-eslint 8.46.4; se añade **a mano** (no con `ng add`, que deja `node_modules` anidados) |
| Backend | Python 3.11+ (probado con 3.13), FastAPI, SQLite; `.venv` dentro de `backend/` |
| SO del usuario | Windows 11; shells disponibles: PowerShell y Git Bash. Chrome en `C:/Program Files/Google/Chrome/Application/chrome.exe` |

```bash
# Backend (desde backend/): crea el .venv la primera vez e instala dependencias
.\start.cmd                  # Windows;  Linux/macOS: ./start.sh     → http://localhost:8000 (docs en /docs, salud en /health)
.venv\Scripts\python.exe run.py        # arranque directo si el .venv ya existe

# Aplicación (desde la carpeta de su proyecto)
npm install                  # una vez (en la carpeta del nivel si hay workspace)
npm start                    # ng serve → http://localhost:4200

# Comprobaciones habituales
npx ng lint
npx tsc --noEmit --strict
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
npx ng build --stats-json
npm run check:architecture   # solo en los TalentHub desde el Lab 12 (+ npm run test:architecture)
npm run audit:debt           # solo en el Lab 20.1
```

Antes de lanzar un servidor, **comprobar que el puerto está libre** (`ng serve` puede caer con «Port already in use» y una prueba acabaría
hablando con la app equivocada). Los puertos que se han usado: 4200 (app principal), 4201, 4202 y 4300 (comparativas), 8000 (backend).

---

## 4. Backend local (`backend/`)

Sustituye a las APIs públicas para que los cambios **se guarden**. Documentación propia en `backend/README.md` y `backend/GUIA.md`.

| Recurso | Campos / reglas relevantes |
| --- | --- |
| `/users` (empleados en TalentHub) | los de JSONPlaceholder + `role`, `skills` `[{name, level}]`, `available`, `projectId` (FK → projects, `ON DELETE SET NULL`), `hiredAt`. Regla: **no disponible ⇒ proyecto obligatorio**. Filtros `?role=&available=&projectId=&q=` |
| `/todos` | `title`, `completed`, `userId` (**FK real → users, `ON DELETE CASCADE`**: borrar un usuario borra sus tareas), `priority` (v3), `description`, `startDate`, `endDate`, `tags` (v4) |
| `/projects` | `name`, `client`, `status` (`active`\|`paused`\|`completed`), `startDate`, `endDate`, `memberIds` (derivado de `users.projectId`). Filtros `?status=&q=`. Borrar un proyecto libera a su equipo (`project_id` NULL, `available` 1) |
| Utilidades | `GET /health` → `{"status":"ok"}`; cabecera `X-Total-Count` expuesta por CORS para la paginación |

Detalles que importan:

- **Migraciones** con `PRAGMA user_version` (esquema actual **v5**); `USERS_SCHEMA_V4` se conserva para las pruebas de migración. La BD se
  siembra tabla a tabla (`RESOURCES` en `db.py`, orden projects → users → todos).
- **Cambios siempre aditivos**: `PUT` conserva los campos no enviados, para no romper los Labs 10 y 10.1 de `1-Basico`. Antes de cada cambio
  se comprobó el contrato con esos dos labs.
- **Hay que preguntar al usuario antes de añadir un recurso o un campo.** Aprobados hasta ahora: `priority` (v3), planificación (v4),
  empleados y proyectos (v5).
- **Dos trampas del servidor** que `TestClient` no detecta: la dependencia de BD debe ser `Depends(get_db, scope="function")` (si no, el
  commit va después de la respuesta y un cliente rápido lee datos viejos) y SQLite necesita `check_same_thread=False` (si no, peticiones
  simultáneas dan 500 sin cabeceras CORS, que el navegador muestra como «error de CORS»). Por eso existe `tests/test_live_server.py`
  (servidor real + concurrencia). **Probar siempre también con carga simultánea.**
- **`data/app.db` contiene datos reales del usuario.** Para medir o probar usar una BD temporal con la variable de entorno
  **`BACKEND_DB=<ruta>`** y dejar los datos como estaban. No subirla salvo petición expresa.
- Ejecutar los tests del backend: desde `backend/`, `.venv\Scripts\python.exe -m pip install -r requirements-dev.txt` (una vez) y
  `.venv\Scripts\python.exe -m pytest`.

### Qué usa cada nivel

| Nivel | Fuente de datos |
| --- | --- |
| Básico — Lab 10 y 10.1 | **Detección automática al arrancar**: una sola comprobación (`GET /health`, máx. 1,5 s). Backend activo → lo usa (los cambios se guardan); si no → JSONPlaceholder. La cabecera muestra una pastilla con la fuente. Código: `src/environments/detect-backend.ts` (+ spec). Solo hay que recargar la página para cambiar de fuente |
| Básico — Labs 01–09 | no usan el backend |
| Intermedio — Lab 10/tareas y Labs 13.1–20.1 | **siempre el backend local** (`http://localhost:8000`); JSONPlaceholder solo en `Lab 10/tareas` con `npm run start:public`. Los Labs 11.1 y 12.1 aún no hacen HTTP |
| Avanzado | por decidir; la regla del usuario es «backend local» (ver §5) |

---

## 5. Reglas y decisiones del usuario (obligatorias)

Fijadas por el usuario durante el trabajo; tratarlas como requisitos.

1. **Subir a GitHub solo cuando lo pide** («sube»). Antes de un commit, mirar `git status` y no incluir lo que no es del trabajo en curso (los
   enunciados que el usuario modifica a mano, `app.db`…). Commits en español, con una línea de resumen y la línea `Co-Authored-By`.
2. **Los Labs 10 y 10.1 de `1-Basico` no se tocan** (la excepción explícita fue añadirles la detección del backend y la pastilla, a petición).
   Para el Intermedio se trabaja sobre una **copia** (`2-Intermedio/Lab 10/tareas`).
3. **No parar procesos que no lancé yo.** Antes de matar un proceso, mirar su línea de comandos y comprobar que es el mío (`ng serve` de una
   carpeta concreta, `run.py` del backend). Los servidores que se lanzan se paran al terminar.
4. **Usar siempre las APIs locales del backend** en el Intermedio (y siguientes); **avisar antes de añadir un recurso o campo nuevo**.
5. **Dominio de la app de tareas en inglés** (`Task`, `title`, `completed`, `priority`, `description`, `startDate`, `endDate`, `tags`), con
   DTO + mapper; no traducir a `Tarea`/`titulo`. TalentHub sí está en español (`Empleado`, `Proyecto`).
6. **Las evidencias van en la carpeta `evidencias/` del Lab que las pide**, generadas con recorridos reales en Chrome (ver §7).
7. **Las prácticas finales son autónomas** (propio `node_modules`, sin compartir).
8. **No aplicar `npm audit fix --force`** si propone bajar de versión; documentar los hallazgos en el README.
9. **Verificar con ejecuciones** y distinguir lo comprobado de lo no comprobado; si un enunciado tiene errores, corregir lo mínimo y decirlo
   siempre en el resumen. Responder en español, claro y con tablas cortas.
10. **No decidir por el usuario** lo que él no ha decidido (p. ej. cuando un enunciado no encaja, exponer opciones con una recomendación).

---

## 6. Patrones técnicos y lecciones aprendidas

Arquitectura de TalentHub (la versión de referencia es `2-Intermedio/Lab 20/talenthub`, explicada en su `DECISION_LOG.md`):

- Standalone + Signals + OnPush en todo; `@for … track`, `@if`, `@defer (on viewport; prefetch on idle)`; `strict: true`; **0 `any`**.
- Estructura `core/` (auth, interceptores, guards), `shared/` (validadores, UI), `features/{empleados,proyectos,dashboard}` con **barrel
  (`index.ts`)** por feature y alias `@core/@shared/@features`. Grafo de dependencias entre features **comprobado y sin ciclos**
  (`proyectos` ← `empleados` ← `dashboard`), por `scripts/check-architecture.mjs` (reglas `barrel`, `capas`, `features`, `onpush`).
- Patrones: **Repository** (servicios HTTP), **Adapter** (DTO + mappers + type guards, `unknown` en la frontera), **Facade** + estado con Signals
  (`EmpleadosFacade`, `EmpleadoStateService`), **Strategy** (filtros combinables), **Decorator** (interceptores).
- Guard funcional como **`canMatch`** (no `canActivate`): `canActivate` deja las rutas hijas abiertas tras cerrar sesión y descarga el chunk
  antes de comprobar la sesión (hallazgo documentado en `Lab 20.1/talenthub/AUDIT.md`).
- ESLint endurecido: `no-explicit-any`, `no-restricted-imports` (imports solo por el barrel; DTO solo desde mappers; las vistas solo hablan con
  la fachada), `prefer-inject`, `prefer-on-push-component-change-detection`, `template/prefer-control-flow`.

Trampas encontradas (para no repetirlas):

| Síntoma | Causa / solución |
| --- | --- |
| Los barrels no compilan con `isolatedModules` | re-exportar tipos con `export type`; los alias `paths` necesitan `./` (TS5090) |
| Tests de rutas que se cuelgan 5 s | el temporizador del toast corre dentro de NgZone: espiar `ToastService.show` en esos tests |
| Aserciones que fallan por una promesa pendiente | vaciar microtareas con `await new Promise(r => setTimeout(r))` |
| Specs de componentes que no arrancan | faltan `provideRouter` o mocks de servicios inyectados; cuidado con el texto con espacios en blanco en las aserciones |
| `@defer` en tests | usar `DeferBlockBehavior.Manual` |
| `<select [ngValue]>` en puppeteer | el valor de la opción es `"3: 3"`, no `3` |
| `webpack-bundle-analyzer` no lee el stats | el builder `@angular/build` (esbuild) emite un metafile de esbuild: analizarlo con un script propio |
| Una herramienta de lint «limpia» | la configuración original no veía OnPush ni `*ngFor`: medir también con la configuración reforzada |
| SQL: error de esquema inexplicable | un comentario dentro del `CREATE TABLE` se tragó una coma; mover el comentario fuera |
| Bash: heredocs largos → «unexpected EOF» / Python con `\s` y `\n` mal escapados | escribir el fichero con la herramienta de escritura, no con heredoc ni con `python -c` |
| La salida de una captura de `ng lint` parecía incorrecta (42 errores) | era la base con deuda; se rehízo como imagen antes/después. **Rotular siempre qué proyecto muestra cada captura** |
| Medir un proyecto sin `node_modules` (`Lab 20.1/base`) | junction de Windows temporal (`mklink /J`) y borrarla con `cmd /c rmdir`, **nunca** con `rm -r` (borraría el destino) |

---

## 7. Cómo se hicieron las evidencias y las mediciones

Los scripts de medida **no están en el repositorio** (vivían en una carpeta temporal de la sesión). Lo que se usó, para reproducirlo:

- **Capturas de la app:** `puppeteer-core` + el Chrome instalado, recorridos reales (login, filtros, alta, errores) y captura de pantalla; las
  «imágenes de Network» y las comparativas antes/después son **tablas HTML generadas con datos reales** y capturadas, no capturas de DevTools.
  Se declara en el README de cada lab.
- **Cobertura:** `ng test --code-coverage` y captura de `coverage/…/index.html` o de la salida de Karma.
- **Bundle:** `ng build --stats-json` + análisis del metafile con esbuild; transferencia estimada con `gzip -9`.
- **Lighthouse:** `lighthouse` v12 contra `ng serve`/build servido.
- **Deuda técnica (Lab 20.1):** `scripts/audit-debt.mjs` (cuenta D-01…D-08), repetible con `npm run audit:debt`.
- **Backend en evidencias:** usar una BD temporal (`BACKEND_DB`) para no ensuciar `app.db`.

---

## 8. Preparar el nivel Avanzado

### 8.1 Qué hay hoy en `3-Avanzado`

Solo enunciados. Observaciones sobre ellos (comprobadas al cerrar esta bitácora):

| Lab | Enunciado | Tema | Observaciones |
| --- | --- | --- | --- |
| 21 | `Lab 21.md` (1.331 líneas) | Observables / programación reactiva sobre una app de usuarios | crea `componente-reactivo` y `observables.service` |
| 22 | `Lab 22.md` (1.092) | Componente anidado `UsuarioCard` dentro de `ListaUsuarios` | redactado como informe de lo ya hecho («Resumen de cambios») |
| 23 | `Lab 23.md` (1.772) | Signals (`signal`, `computed`, `effect`), migrar servicios de RxJS | dice «esta práctica se realiza en Angular 21» |
| 24 | `Lab 24.md` (4.274) | Migración a Reactive Forms | el más largo; teoría + 3 partes |
| 25 | `Lab 25.md` | **vacío (0 líneas)** | pendiente de que el usuario lo aporte |
| 26 | `Lab 26.md` (881) | Lazy loading en «Gestión de Usuarios» | análisis de bundles y DevTools |
| 27 | `Lab 27.md` (559) | Desplegar en Docker/Podman | **casi idéntico al Lab 28** (28 omite la sección «Recursos adicionales») |
| 28 | `Lab 28.md` (549) | Desplegar en Docker/Podman | ver arriba |
| 29 | `Lab 29.md` (779) | **Práctica final:** CRUD de Tareas (modelo, servicio con Signals, lista con filtros, formulario, detalle, lazy, integración con usuarios) | requiere partir de «Gestión de Usuarios» y habla de Angular 21 |

Todos los enunciados proceden de **otra solución** (hay rutas tipo `.labs/Revamping/…/gestion-usuarios-app`, nombres `ListaUsuarios`,
`UsuarioService`, `NotificacionService`, `LoggerService`…). Como en los niveles anteriores: **adaptar lo mínimo y decirlo**.

### 8.2 Decisiones que hay que tomar con el usuario antes de empezar (no decidir por él)

1. **Aplicación base.** Los enunciados asumen una app «Gestión de Usuarios» que **no existe en el repo**. Candidatas: una copia del
   Lab 10.1 (`1-Basico/Lab 10.1/userManagerApp`, el «Gestor de Usuarios», que no se toca: se trabajaría sobre una copia en `3-Avanzado`) o
   continuar el TalentHub del Lab 20 (autónomo). Recomendación razonable: copia del Lab 10.1 para los Labs 21–28, porque es el «Gestión de
   Usuarios» de los enunciados, y copia de la app de tareas para el Lab 29 (CRUD de tareas con integración con usuarios).
2. **Versión de Angular.** Los enunciados mencionan Angular 21; el curso y todo el repo están fijados en **20.3** (Node < 22). Confirmar si se
   mantiene la línea 20 (lo coherente hasta ahora) o se sube.
3. **Workspace.** Si los Labs 21–28 comparten `node_modules` (patrón previsto `"Lab 2[1-8]/*"`) y el Lab 29 es autónomo, como en los niveles
   anteriores. Confirmar.
4. **Lab 25 vacío** y **Labs 27/28 casi duplicados**: pedir el enunciado del 25 y aclarar si 27 y 28 son el mismo ejercicio (Docker) o si falta
   uno.
5. **Backend.** Si `/users` y `/todos` bastan (cubren «usuarios» y «tareas» del Lab 29) o se necesita algo nuevo. **Preguntar antes** de
   cualquier cambio; si lo hay, aditivo y comprobando el contrato con los Labs 10 y 10.1.
6. **Docker (Labs 27/28):** ¿hay Docker o Podman en la máquina? No se ha comprobado; el despliegue del backend también entraría en juego.

### 8.3 Checklist para cada lab del Avanzado

1. Leer el enunciado entero y señalar las diferencias con el repo (rutas, nombres, versiones). Partirlo en `.1`/`.2` si trae dos mitades.
2. Copiar el proyecto del lab anterior con nombre de paquete único; instalar según el patrón de workspace elegido.
3. Implementar usando el backend local (sin simulaciones); comprobar el puerto libre antes de servir.
4. Comprobar: `ng lint` 0, `tsc --strict` 0, tests en verde, `ng build`, y, si hay arquitectura, `check:architecture`.
5. Generar las evidencias que pida el enunciado en `evidencias/` del lab (§7) y probar el flujo real en Chrome.
6. Escribir README (cómo arrancar, qué cambió, desviaciones respecto al enunciado) y, en prácticas finales, `DECISION_LOG.md`.
7. Actualizar el `README.md` raíz (tabla de proyectos y estado del nivel).
8. Resumir al usuario lo comprobado y lo no comprobado; **esperar su «sube»** para hacer commit y push.

---

## 9. Historial resumido (commits relevantes)

| Commit | Contenido |
| --- | --- |
| `8eb2d57` … `a9a757d` | Labs 11 y 12 (TalentHub 11.1/12.1; tareas 11.2/12.2 sobre la copia del Lab 10 en el Intermedio) |
| `c3cf09f` | El Lab 10 del Intermedio usa el backend local por defecto |
| `140f13e`, `84f5a73` | Labs 13 y 14 (router profesional; HTTP y capa de datos) |
| `015adad` | Lab 15 (RxJS aplicado) + `priority` en el backend (v3) |
| `8304453` | Lab 16 (formularios reactivos) + planificación en el backend (v4) |
| `7cf75e9` | Lab 17 (estado con Signals y fachadas) |
| `7fc2843` | Lab 18 (testing pragmático) |
| `33e0db3` | Lab 19 (performance y calidad: `@defer`, bundle, Lighthouse) |
| `3fad1f8` | Lab 20 (TalentHub final) + backend v5 (empleados y proyectos reales) |
| `92b3dad`, `8ef95a3` | Lab 20.1 (refactor guiado por métricas) y su enunciado |
| `2e5deb7` | Enunciados actualizados de los Labs 14–19 y 21–29 |
| `1bc3b66` | Detección automática del backend en los Labs 10 y 10.1 de Básico |
| `c03d4a4` | `backend/data/app.db` con los datos de las pruebas (subida puntual) |
| `00724fc` | Comentarios de los Labs 11.1–18.1 alineados (la API es el backend local) |

---

## 10. Pendientes y riesgos conocidos

- El Intermedio usa el backend **sin respaldo**: si no está arrancado, las apps muestran el error de carga. La detección automática con
  JSONPlaceholder solo existe en el nivel Básico (Lab 10 y 10.1). Se podría replicar si el usuario lo pide.
- `1-Basico/Lab 10` y `Lab 10.1` tienen ahora `detect-backend.ts`; `npm run start:local` quedó **redundante** (la detección lo sobrescribe).
- El bundle de TalentHub crece 0,8 kB por red con `@defer` (runtime de `@defer` ≈ 8,6 kB); está medido y explicado en el `AUDIT.md` del Lab 20.1.
- Los scripts de medida de las evidencias no están versionados (§7); si se necesitan, recrearlos o decidir con el usuario si se guardan en el repo.
- `Lab 20.1.md` y los enunciados del Avanzado son **del usuario**: no reescribirlos; cualquier corrección se documenta aparte.
- Advertencia de Git en Windows «LF will be replaced by CRLF»: es solo de saltos de línea y no afecta a los commits.
