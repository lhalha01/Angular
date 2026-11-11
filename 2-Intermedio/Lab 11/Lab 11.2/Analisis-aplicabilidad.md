# Lab 11.2 — Análisis de aplicabilidad

**Fecha:** 2026-11-11 · **Enunciado:** [`Lab 11.2.md`](Lab%2011.2.md) · **Proyectos analizados:** Lab 10 (Gestor de
Tareas) y Lab 10.1 (Gestor de Usuarios), sin modificarlos.

## Conclusión

El enunciado del Lab 11.2 **no se puede aplicar tal cual** a los proyectos del Lab 10, porque casi todas sus
premisas no se cumplen: parte de una aplicación con `any` por todas partes, con un `tarea.service.ts` y modelos
`Tarea`/`Usuario` en español, y la nuestra **no tiene ningún `any`**, ya compila con `tsc --strict` y usa
`Task`/`User` en inglés (los campos de la API). Aplicar sus fases literalmente significaría inventar problemas
que no existen.

Sí es posible una **versión adaptada** que tendría trabajo real: la auditoría de la Fase 1, ejecutada de verdad,
encontró hallazgos genuinos (véase el apartado 2). No se ha realizado el refactor; la decisión sobre el alcance
está pendiente (apartado 4).

## 1. Lo que asume el enunciado frente a lo que hay

| El enunciado asume… | Realidad en el Lab 10 / Lab 10.1 |
| --- | --- |
| Código con `any` que hay que sustituir | **0 `any`** (regla `@typescript-eslint/no-explicit-any`) en el código de la app y en los tests, en los dos proyectos |
| `npx tsc --noEmit --strict` con errores | **Sin errores** en los dos (código de salida 0) |
| `ng lint` disponible | **No estaba configurado** en ninguno de los dos; se ejecutó con la configuración del Lab 11.1 sobre una copia |
| Modelos `Tarea` y `Usuario` (`titulo`, `completada`, `prioridad`, `descripcion`, `activo`…) en `src/app/models/` | Modelos `Task` y `User` en inglés (`title`, `completed`, `userId`, `createdAt`…) en `core/models/`; **`prioridad`, `descripcion` y `activo` no existen** en la API de la que vienen los datos |
| `tarea.service.ts` con `getTareas(): Tarea[]` y `crear(t)` | `TaskService` basado en `Observable`, que extiende `InMemoryResource` |
| `this.http.get<Tarea[]>('/api/tareas')` | URL base configurable por entorno (`environment.apiUrl`): JSONPlaceholder o el backend propio |
| Propiedades `@Input()` / `@Output()` con `any` | Componentes con signals: `input()` ×14, `output()` ×6, `model()` ×7 y un único `@Input()` en el Lab 10; todos tipados |

## 2. Fase 1 (auditoría) ejecutada de verdad

| Comprobación | Lab 10 | Lab 10.1 |
| --- | --- | --- |
| Archivos analizados (`.ts` y `.html`) | 67 | 28 |
| `@typescript-eslint/no-explicit-any` | **0** | **0** |
| Errores de lint (`typescript-eslint` + `angular-eslint`) | **2** | 0 |
| `tsc --noEmit --strict` | sin errores | sin errores |
| Llamadas `HttpClient` sin tipo (`get`/`post`/`put`/`patch`/`delete` sin `<T>`) | **4 de 9** | 0 de 6 |

**Hallazgos reales** (los únicos que justifican trabajo en un refactor de tipos y calidad):

1. **Dos errores de lint de accesibilidad** en `shared/confirm-dialog/confirm-dialog.component.ts` (línea 14): `click-events-have-key-events` e `interactive-supports-focus`. El `<dialog>` cierra al hacer clic en el
   fondo, sin equivalente de teclado. No son de tipos, pero `ng lint` a 0 errores es un criterio del enunciado.
2. **Cuatro llamadas HTTP sin tipo** en `core/services/in-memory-resource.ts` (líneas 82, 96, 105 y 110): son las
   escrituras con la API pública, cuya respuesta se ignora a propósito (`ignoreServerOutcome`). Devuelven
   `Observable<Object>`; no hay `any`, pero tampoco tipo.
3. **Fronteras de datos sin validar:** las respuestas HTTP se aceptan con `get<T[]>(…)` sin comprobar su forma;
   `StorageService` devuelve texto crudo de `localStorage`; los parámetros de ruta se convierten con `Number(…)`. Es
   donde el enunciado pide un **type guard** (Fase 4, punto 3), y aquí sí tiene sentido.

## 3. Fase por fase

| Fase del enunciado | ¿Aplica? | Comentario |
| --- | --- | --- |
| **1. Auditoría de tipos** | Sí | Hecha (apartado 2). Resultado: 0 `any`, 2 errores de lint, 4 llamadas sin tipo |
| **2. Interfaces de dominio** (`Tarea`, `Usuario`) | No tal cual | Los modelos del enunciado inventarían campos que la API no tiene. Equivalentes ya existen (`Task`, `User`, `TaskDraft`); se podrían mover a `src/app/models/` y expresar con Utility Types |
| **3. Actualizar servicios** | Parcial | "Reemplazar `any`": no hay ninguno. "Tipar retornos": ya está. "Tipar las llamadas HTTP": aplica a las 4 llamadas sin tipo |
| **4. Actualizar componentes** | Parcial | "Tipar `@Input`/`@Output`": ya están tipados. "Eliminar `any`": no hay. "Type guard en la fuente externa": aplica a las respuestas HTTP y a `localStorage` |

**Criterios de aceptación del enunciado:** `ng lint` sin errores de `no-explicit-any` ✔ (ya) · `tsc --strict` ✔ (ya) ·
modelos en `src/app/models/` ✘ (están en `core/models/`) · sin `as any` ✔ (ya) · "aplicación funcionando sin
cambios visibles" ✔ si no se toca.

## 4. Qué se podría hacer, y la decisión pendiente

| Opción | Qué incluye | Esfuerzo |
| --- | --- | --- |
| **A. Versión adaptada** (recomendada) | Copia del Lab 10; `ng lint` configurado; corregir los 2 errores de accesibilidad; tipar las 4 llamadas HTTP; type guards en las respuestas de la API y en `localStorage`; mover los modelos a `src/app/models/` con Utility Types. Nombres en inglés; la aplicación, idéntica | Medio |
| **B. Traducir el dominio al español** | `Tarea`/`Usuario` con DTOs y mappers desde la API, como en el Lab 11.1. La API no tiene `prioridad` ni `descripcion`: habría que inventarlos | Alto (toca casi todos los archivos y tests) |
| **C. Solo este informe** | Dejar constancia de que el enunciado no aplica y de qué se comprobó | Ninguno |

**Pendiente:** elegir A, B o C. Conviene además confirmar si el Lab 11.2 se evalúa sobre la aplicación de partida de
cada alumno (con `any`), en cuyo caso el enunciado sí tendría sentido para ellos pero no para nuestra aplicación, que
ya estaba tipada.

## Método (reproducible)

- **Lint:** se copió `src/` de cada proyecto a una carpeta temporal (ya eliminada) y se ejecutó `eslint` con la
  configuración del Lab 11.1 (`typescript-eslint` recomendada y estilística, `angular-eslint` recomendada, de
  plantillas y de accesibilidad, con `no-explicit-any` como error). Los proyectos originales no se tocaron.
- **Tipos:** `npx tsc --noEmit --strict -p tsconfig.app.json` en cada proyecto.
- **Llamadas HTTP, decoradores y fuentes externas:** búsquedas con `grep` en `src/app` (sin los `*.spec.ts`).
