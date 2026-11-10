# Curso de Angular: laboratorios

Repositorio con las prácticas del curso de Angular. Cada laboratorio vive en su carpeta `Lab NN`,
con su enunciado (`Lab NN.md`) y, cuando corresponde, el proyecto Angular que lo resuelve.

## Niveles del curso

| Nivel | Laboratorios | Práctica final | Estado |
| --- | --- | --- | --- |
| Básico | Lab 01 a Lab 09 | Lab 10 y Lab 10.1 | Completado |
| Intermedio | Lab 11 a Lab 19 | Lab 20 y Lab 20.1 | Pendiente |
| Avanzado | Lab 21 a Lab 28 | Lab 29 | Pendiente |

## Proyectos del nivel Básico

| Laboratorio | Proyecto | Contenido |
| --- | --- | --- |
| Lab 01 | `Lab 01/helloWorld` | Primera aplicación |
| Lab 02 | `Lab 02/debugApp` | Depuración |
| Lab 03 | `Lab 03/welcomeApp` | Componentes |
| Lab 04 | `Lab 04/routerApp` | Router |
| Lab 05 | `Lab 05/directivesApp` | Directivas |
| Lab 06 | `Lab 06/dataBindingsApp` | Data binding |
| Lab 07 | `Lab 07/pipesApp` | Pipes |
| Lab 08 | `Lab 08/productsApp` | Servicios |
| Lab 09 | `Lab 09/lifecycleApp` | Ciclo de vida |
| Lab 10 | `Lab 10/lab-10-app` | **Práctica final:** Gestor de Tareas |
| Lab 10.1 | `Lab 10.1/userManagerApp` | **Práctica final:** Gestor de Usuarios |

Cada laboratorio parte del código del anterior (cabecera, rutas y componentes acumulados).

## Estructura de dependencias

Hay dos tipos de proyecto, según cómo gestionan `node_modules`:

| Tipo | Proyectos | `node_modules` y `package-lock.json` |
| --- | --- | --- |
| **Compartidos** (npm workspaces) | Laboratorios normales de cada nivel | Uno solo, en la raíz del repositorio |
| **Autónomos** | Prácticas finales: Lab 10, Lab 10.1, Lab 20, Lab 20.1 y Lab 29 | Propios, dentro de la carpeta de cada proyecto |

Los laboratorios normales comparten una única instalación para ahorrar espacio en disco. Las prácticas
finales son entregables, por lo que son independientes: se pueden copiar a otro repositorio y funcionan
con su propio `package.json` y `package-lock.json`.

El grupo compartido se define en el `package.json` de la raíz (campo `workspaces`):

| Nivel | Patrón de `workspaces` |
| --- | --- |
| Básico (Lab 01 a Lab 09) | `Lab 0*/*` (activo) |
| Intermedio (Lab 11 a Lab 19) | `Lab 1[1-9]/*` (se añadirá al empezar el nivel) |
| Avanzado (Lab 21 a Lab 28) | `Lab 2[1-8]/*` (se añadirá al empezar el nivel) |

Los patrones dejan fuera de forma natural las prácticas finales (`Lab 10`, `Lab 10.1`, `Lab 20`,
`Lab 20.1` y `Lab 29`).

## Requisitos

- **Node.js** 20.19 o superior y menor que 22 (requisito del curso).
- **npm** 10 o superior.
- **Chrome o Chromium**, solo para ejecutar los tests unitarios.
- **Angular 20.3** (CLI 20.3.x), la versión fijada por el curso.

## Cómo ejecutar un proyecto

### Laboratorios compartidos (Lab 01 a Lab 09)

```bash
# desde la raíz del repositorio, una sola vez
npm install

# arrancar un laboratorio
cd "Lab 05/directivesApp"
npm start                 # http://localhost:4200/
```

### Prácticas finales (autónomas)

```bash
cd "Lab 10/lab-10-app"            # o "Lab 10.1/userManagerApp"
npm install                       # o npm ci, para instalar exactamente lo fijado en el lockfile
npm start                         # http://localhost:4200/
```

Tests de una práctica final (necesitan Chrome o Chromium):

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Si el puerto 4200 está ocupado, se puede elegir otro: `npx ng serve --port 4201`.

## Cómo crear un laboratorio nuevo

### Laboratorio compartido

```bash
cd "Lab 11"
npx -p @angular/cli@20 ng new miApp --routing --style=scss --ssr=false --zoneless=false \
    --skip-git --skip-install --ai-config=none --package-manager=npm
# desde la raíz del repositorio:
npm install
```

Antes del primer laboratorio de un nivel hay que añadir su patrón al campo `workspaces` de la raíz
(véase la tabla anterior).

### Práctica final autónoma

```bash
cd "Lab 20"
npx -p @angular/cli@20 ng new miApp --routing --style=scss --ssr=false --zoneless=false \
    --skip-git --ai-config=none --package-manager=npm
```

Sin `--skip-install`: la práctica instala sus propias dependencias y genera su `package-lock.json`.
Hay que confirmar que su carpeta **no** coincide con ningún patrón de `workspaces`.

## Calidad y seguridad de dependencias

Las prácticas finales documentan en su propio `README.md` la revisión de integridad
(`npm audit signatures`), la de vulnerabilidades (`npm audit`) y las versiones utilizadas.
Resumen a fecha de 2026-11-10:

| Práctica | Firmas verificadas | Vulnerabilidades en producción | Vulnerabilidades totales |
| --- | --- | --- | --- |
| Lab 10 | 941 | 0 | 21 moderadas (herramientas de desarrollo) |
| Lab 10.1 | 541 | 0 | 16 moderadas (herramientas de desarrollo) |

Todas las entradas de los `package-lock.json` llevan hash de integridad y proceden del registro de npm.

## Notas

- `node_modules/`, `dist/` y `.angular/` no se versionan (véase `.gitignore`).
- Angular 21 admite Node 20.19 y sería la siguiente migración posible; Angular 22 exige Node 22.22 o
  superior, incompatible con el requisito del curso.
