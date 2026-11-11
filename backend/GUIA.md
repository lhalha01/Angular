# Guía: arrancar el backend y usarlo desde Angular

Esta guía explica, paso a paso, cómo poner en marcha el backend de los laboratorios y cómo hacer que una
aplicación Angular lo use en lugar de las APIs públicas. No hace falta saber Python.

> Referencia técnica completa (endpoints, validaciones, migraciones, tests): [README.md](README.md).

**Índice:** [1. Qué es](#1-qué-es-y-para-qué-sirve) · [2. Arrancarlo](#2-arrancar-el-backend) ·
[3. Probarlo](#3-comprobar-que-funciona) · [4. Usarlo desde los labs](#4-usarlo-desde-los-labs-ya-preparados) ·
[5. Cómo se conecta Angular](#5-cómo-se-conecta-angular-por-dentro) ·
[6. Llamar a la API con HttpClient](#6-llamar-a-la-api-con-httpclient) ·
[7. Conectar un lab nuevo](#7-conectar-un-lab-nuevo) · [8. Problemas frecuentes](#8-problemas-frecuentes) ·
[9. Resumen](#9-resumen-rápido)

---

## 1. Qué es y para qué sirve

Las prácticas usan por defecto una API pública de mentira (JSONPlaceholder). Funciona sin instalar nada, pero
**no guarda los cambios**: lo que creas, editas o borras se pierde al recargar la página.

El backend de esta carpeta es una API propia, local, que **sí los guarda** (en un archivo SQLite). Ofrece dos
recursos, con el mismo formato que JSONPlaceholder:

| Recurso | Qué es | Lo usan |
| --- | --- | --- |
| `/users` | Usuarios | Lab 10 y Lab 10.1 |
| `/todos` | Tareas de un usuario | Lab 10 |

Las tareas pertenecen a un usuario: **si borras un usuario, se borran también sus tareas**.

Es **opcional**: ninguna práctica lo necesita para funcionar. Con `npm start` siguen usando la API pública.

---

## 2. Arrancar el backend

### Requisitos

- **Python 3.11 o superior.** Compruébalo con `python --version` (en Windows también sirve `py --version`).
- Conexión a internet **solo la primera vez**, para instalar las dependencias.

No hace falta instalar nada más: ni una base de datos (SQLite viene con Python) ni Docker.

### Paso a paso

1. Abre una terminal en la carpeta `backend/` del repositorio.
2. Ejecuta el script de arranque:

   | Sistema | Comando |
   | --- | --- |
   | Windows (PowerShell) | `.\start.cmd` |
   | Windows (cmd) | `start.cmd` |
   | Linux / macOS | `./start.sh` |

3. Espera a ver este mensaje (la primera vez tarda unos 15 a 20 segundos en instalar):

   ```text
   Documentación interactiva: http://127.0.0.1:8000/docs
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```

4. **Deja esa terminal abierta**: el backend funciona mientras no la cierres. Para pararlo, pulsa `Ctrl + C`.

Lo que hace el script por ti la primera vez: crea un entorno virtual (`.venv`), instala las dependencias de
`requirements.txt`, crea la base de datos `data/app.db` con los datos iniciales (10 usuarios y 200 tareas) y
arranca el servidor. Las siguientes veces solo comprueba y arranca.

### Opciones

Se añaden detrás del comando:

```bash
.\start.cmd --port 8001      # otro puerto (por defecto, 8000)
.\start.cmd --reset          # borra la base de datos y vuelve a los datos iniciales
.\start.cmd --host 0.0.0.0   # la API accesible desde otros equipos (ver "Seguridad": no lo uses en redes abiertas)
```

---

## 3. Comprobar que funciona

Con el backend en marcha, abre en el navegador:

| URL | Qué deberías ver |
| --- | --- |
| http://localhost:8000/health | `{"status":"ok"}` |
| http://localhost:8000/users | La lista de usuarios (JSON) |
| http://localhost:8000/todos | La lista de tareas (JSON) |
| http://localhost:8000/docs | Documentación interactiva: puedes **probar cada endpoint** desde ahí |

> Si `/health` no responde, el backend no está arrancado: vuelve al paso 2.

---

## 4. Usarlo desde los labs ya preparados

Los Labs 10 y 10.1 ya están adaptados. Necesitas **dos terminales**:

```bash
# Terminal 1: el backend (déjala abierta)
cd backend
.\start.cmd                      # Windows;  en Linux/macOS: ./start.sh

# Terminal 2: la aplicación Angular, en la configuración "local"
cd "1-Basico/Lab 10/lab-10-app"          # o "1-Basico/Lab 10.1/userManagerApp"
npm install                              # solo la primera vez
npm run start:local                      # http://localhost:4200/
```

| Quieres… | Comando | Los cambios… |
| --- | --- | --- |
| Usar la API pública (sin backend) | `npm start` | se pierden al recargar |
| Usar el backend propio | `npm run start:local` | **se guardan** |

Prueba que se guardan: crea una tarea (Lab 10) o un usuario (Lab 10.1), **recarga la página con F5** y comprueba que
sigue ahí.

### Qué cambia al usar el backend

- **Los errores de la API se muestran.** Con la API pública se ignoran; con el backend, si algo falla ves un aviso
  con el motivo. Si el backend no está arrancado: *"no se pudo conectar con el servidor. ¿Está arrancado el
  backend?"*
- **El id lo asigna el servidor** al crear.
- **"Deshacer" el borrado de una tarea (Lab 10)** la recrea en el servidor con su mismo id y su fecha.
- **Borrar un usuario (Lab 10.1) avisa de sus tareas:** *"Ana tiene 20 tareas asignadas. Si lo eliminas, también se
  eliminarán sus 20 tareas."* Con la API pública no hay cascada y no se avisa.

---

## 5. Cómo se conecta Angular (por dentro)

La aplicación decide a qué API hablar según la **configuración de compilación** de Angular. Hay tres piezas.

**1. Dos archivos de entorno** (`src/environments/`):

```ts
// environment.ts  → configuración por defecto: API pública
export const environment: Environment = {
  apiUrl: 'https://jsonplaceholder.typicode.com',
  persistentApi: false,
};

// environment.local.ts  → configuración "local": backend propio
export const environment: Environment = {
  apiUrl: 'http://localhost:8000',
  persistentApi: true,
};
```

- `apiUrl` es la dirección base de la API.
- `persistentApi` indica si la API **guarda** los cambios. Con `false` la aplicación simula las altas y bajas en
  memoria; con `true` usa lo que responde el servidor.

**2. `angular.json`**: la configuración `local` sustituye un archivo por el otro al compilar.

```json
"build": {
  "configurations": {
    "local": {
      "optimization": false,
      "sourceMap": true,
      "fileReplacements": [
        { "replace": "src/environments/environment.ts",
          "with":    "src/environments/environment.local.ts" }
      ]
    }
  }
},
"serve": {
  "configurations": {
    "local": { "buildTarget": "<nombre-del-proyecto>:build:local" }
  }
}
```

**3. Un script en `package.json`** para no escribir el comando largo:

```json
"start:local": "ng serve --configuration local"
```

Así, el código de la aplicación **nunca escribe la URL a mano**: siempre usa `environment.apiUrl`, y cambia sola
según cómo se arranque.

---

## 6. Llamar a la API con HttpClient

La aplicación necesita `provideHttpClient()` en `app.config.ts`. Después, un servicio como este habla con `/todos`
(es una versión simplificada de lo que hacen los labs):

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
  createdAt: string; // fecha ISO 8601 en UTC, la guarda el servidor
}
export type TodoDraft = Pick<Todo, 'userId' | 'title' | 'completed'>;

@Injectable({ providedIn: 'root' })
export class TodoApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/todos`;

  /** Todas las tareas. */
  list(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.url);
  }

  /** Una página, con el total (cabecera X-Total-Count). */
  page(page: number, limit: number): Observable<{ items: Todo[]; total: number }> {
    return this.http
      .get<Todo[]>(this.url, { params: { _page: page, _limit: limit }, observe: 'response' })
      .pipe(map((r) => ({ items: r.body ?? [], total: Number(r.headers.get('X-Total-Count')) })));
  }

  /** Crea una tarea: NO se envía el id, lo asigna el servidor. */
  create(draft: TodoDraft): Observable<Todo> {
    return this.http.post<Todo>(this.url, draft);
  }

  /** Sustituye la tarea completa. */
  replace(todo: Todo): Observable<Todo> {
    return this.http.put<Todo>(`${this.url}/${todo.id}`, todo);
  }

  /** Cambia solo los campos indicados. */
  patch(id: number, changes: Partial<TodoDraft>): Observable<Todo> {
    return this.http.patch<Todo>(`${this.url}/${id}`, changes);
  }

  /** Borra la tarea (responde 204, sin cuerpo). */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

### Filtrar, buscar y paginar

Se hace con parámetros en la URL (todos opcionales):

| Parámetro | Ejemplo | Efecto |
| --- | --- | --- |
| `userId` | `/todos?userId=2` | Solo las tareas de ese usuario |
| `completed` | `/todos?completed=true` | Solo completadas (o `false`: pendientes) |
| `q` | `/todos?q=comprar` | Busca en el título (en `/users`, en nombre, usuario y email) |
| `_page` y `_limit` | `/todos?_page=2&_limit=10` | Paginación (`_limit` máximo: 200 en tareas, 100 en usuarios) |

La cabecera `X-Total-Count` de la respuesta da el total **ya filtrado y antes de paginar**. Para leerla hay que
usar `observe: 'response'`, como en `page()`.

### Gestionar los errores

Con el backend, los errores llegan a tu código y debes enseñárselos al usuario:

```ts
import { HttpErrorResponse } from '@angular/common/http';

this.api.create(draft).subscribe({
  next: (todo) => this.toast.show(`Tarea #${todo.id} creada`),
  error: (e: HttpErrorResponse) => {
    if (e.status === 0) {
      this.toast.show('No se pudo conectar con el servidor. ¿Está arrancado el backend?');
    } else {
      this.toast.show(`No se pudo crear: ${e.error?.detail ?? 'error ' + e.status}`);
    }
  },
});
```

| Código | Significa | Cuándo |
| --- | --- | --- |
| `0` | No hay respuesta | El backend no está arrancado |
| `404` | No existe | Un id que no existe, o ya borrado |
| `409` | Conflicto | Un `POST` con un `id` que ya está en uso |
| `422` | Datos no válidos | Título corto, email mal formado, usuario inexistente… |

El motivo viene en `error.detail`: un texto, o una lista de objetos con `msg` cuando es un error de validación.

### Restaurar un registro borrado ("Deshacer")

El `POST` acepta opcionalmente `id` y `createdAt`. Si el id está libre, el servidor recrea el registro **tal como
era**; si no, responde 409. Es lo que usa el "Deshacer" del Lab 10:

```ts
restore(todo: Todo): Observable<Todo> {
  return this.http.post<Todo>(this.url, todo); // con su id y su fecha originales
}
```

---

## 7. Conectar un lab nuevo

Para que otro proyecto Angular pueda usar el backend:

1. **Crea los entornos.** Copia `src/environments/` de un lab ya adaptado (`environment.model.ts`, `environment.ts`
   y `environment.local.ts`).
2. **Añade la configuración `local`** en `angular.json`, en `build` y en `serve` (véase el apartado 5), cambiando el
   nombre del proyecto en `buildTarget`.
3. **Añade el script** `"start:local": "ng serve --configuration local"` a `package.json`.
4. **Usa `environment.apiUrl`** en tus servicios, nunca una URL escrita a mano.
5. **Importante:** `environment.ts` se sustituye por otro archivo al compilar, así que la interfaz `Environment` debe
   estar en un archivo aparte (`environment.model.ts`). Si la declaras dentro de `environment.ts`, la configuración
   `local` no compilará.
6. **Muestra los errores** de las escrituras (apartado 6): con el backend ya no se ignoran.
7. Si el recurso que necesitas no existe en el backend, añádelo (véase "Añadir un recurso nuevo" en el
   [README](README.md)).

---

## 8. Problemas frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `python` no se reconoce | Python no está instalado o no está en el `PATH` | Instala Python 3.11 o superior y marca "Add to PATH". En Windows prueba también `py --version` |
| El script falla al instalar | No hay internet la primera vez | Conéctate y vuelve a ejecutarlo; las siguientes veces no hace falta |
| `Port 8000 is already in use` / no arranca | Otro programa usa el puerto 8000 (quizá otro backend ya en marcha) | Cierra el otro, o usa `--port 8001` y cambia `apiUrl` en `environment.local.ts` |
| La app muestra *"no se pudo conectar con el servidor"* | El backend no está arrancado | Arráncalo (apartado 2) y comprueba http://localhost:8000/health |
| En la consola del navegador: *"blocked by CORS policy"* | Casi siempre, el backend **no está arrancado** o devolvió un error 500 (esas respuestas salen sin cabeceras de CORS y el navegador lo presenta como un error de CORS) | Comprueba `/health` y mira la terminal del backend: ahí aparece el error real |
| `npm run start:local` no existe | El proyecto no está adaptado | Sigue el apartado 7 |
| La lista sale vacía o con datos raros | Estás en `npm start` (API pública) pero esperabas datos del backend, o al revés | Mira la URL de las peticiones en la pestaña Red del navegador: `localhost:8000` es el backend |
| Quiero empezar de cero | — | `.\start.cmd --reset` (borra la base de datos y vuelve a los datos iniciales) |
| `422` al guardar una tarea | Datos no válidos o el usuario no existe | Lee el motivo en el aviso; por ejemplo, el título debe tener entre 3 y 120 caracteres |
| Ya no puedo crear tareas para el usuario 1 | Ese usuario se borró (el borrado es real y persistente) | Crea otro usuario o usa `--reset` |

---

## 9. Resumen rápido

```bash
# 1. Backend (terminal 1, déjala abierta)
cd backend
.\start.cmd              # Windows;  ./start.sh en Linux/macOS

# 2. Aplicación Angular (terminal 2)
cd "1-Basico/Lab 10/lab-10-app"      # o  "1-Basico/Lab 10.1/userManagerApp"
npm run start:local
```

| Dirección | Qué es |
| --- | --- |
| http://localhost:8000 | El backend |
| http://localhost:8000/docs | Documentación interactiva de la API |
| http://localhost:4200 | La aplicación Angular |

### Seguridad

El backend está pensado para **uso local y didáctico**: por defecto solo escucha en `127.0.0.1` (únicamente accesible
desde tu equipo), **no tiene autenticación** y el navegador solo deja que lo llamen páginas en `localhost` (CORS),
incluso si lo arrancas con `--host 0.0.0.0`. No lo publiques en internet tal cual.
