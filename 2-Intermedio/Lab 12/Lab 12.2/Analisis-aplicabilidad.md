# Lab 12.2 — Análisis de aplicabilidad

**Fecha:** 2026-11-11 · **Enunciado:** [`Lab 12.2.md`](Lab%2012.2.md) · **Proyecto analizado:** Lab 10 (Gestor de
Tareas), sin modificarlo.

## Conclusión

**El Lab 12.2 no se realiza**, porque no se puede aplicar sin modificar el Lab 10, y el Lab 10 no se toca.

El enunciado es un **refactor en el sitio** de la aplicación de tareas y usuarios del laboratorio anterior: manda
*mover* archivos y *actualizar todos los imports rotos*. La única aplicación de tareas y usuarios que tenemos es el
Lab 10, que es una **práctica final entregable**: autónoma, auditada, con sus tests y con un README que documenta su
estado exacto. Aplicar el enunciado exigiría mover o reescribir casi la mitad de sus archivos.

## 1. Qué exige el enunciado

| Fase | Qué manda | Naturaleza |
| --- | --- | --- |
| 1. Estructura | Crear `core/`, `shared/` y `features/tareas`, `features/usuarios` | Reorganiza el proyecto existente |
| 2. Mover artefactos | «Mueve `tarea.model.ts` y `usuario.model.ts`… los servicios… cada componente… Actualiza todos los imports rotos» | **Modifica los archivos existentes** |
| 3. Barrel files | Crear `index.ts` y cambiar todos los imports para usarlos | Modifica los imports de todo el proyecto |
| 4. Alias de rutas | Configurar `paths` en `tsconfig.json` | Modifica la configuración del proyecto |
| Criterios | «La aplicación funciona igual que antes del refactor» | Compara con la versión previa del mismo proyecto |
| Entregable | «Rama o commit con el refactor estructural» | El resultado es un cambio sobre el proyecto |

## 2. Qué proyecto sería, y por qué no puede cambiar

La aplicación sobre la que actúa el enunciado es el **Lab 10** (Gestor de Tareas). El Lab 10.1 (Gestor de Usuarios)
no tiene tareas. El Lab 10 es una práctica final: se entrega, y su carpeta incluye la evidencia de esa entrega.

El README del Lab 10 afirma, entre otras cosas, que «`npm test` ejecuta 221 tests (cobertura ≈99 % de líneas)» y que
«los 941 paquetes tienen firma de registro verificada». Son afirmaciones sobre un estado concreto. Reestructurar el
proyecto obligaría a volver a verificarlas, y su sección «Estructura y decisiones de diseño» (el árbol de carpetas)
quedaría desactualizada.

## 3. Cuánto habría que modificar (medido)

Se contaron los archivos de `src/app` que el enunciado obligaría a mover o a editar:

| Medida | Valor |
| --- | --- |
| Archivos `.ts` del proyecto (`src/app`) | 62 (28 de ellos, tests) |
| Archivos que la Fase 2 manda **mover** | **27** (12 de ellos, tests): los modelos, los servicios de tareas y de usuarios, y todo `features/tasks` |
| Archivos que no se mueven pero **hay que editar** por sus imports | 2 (`app.routes.ts` y `app.routes.spec.ts`) |
| Imports que cambian de ruta (mínimo) | **41** |
| Archivos afectados en total | **29 de 62 (47 %)** |

La cifra de imports es un **mínimo**: no cuenta los imports entre dos archivos que se mueven a la vez, cuya ruta
relativa también cambia al anidar los componentes en una carpeta `components/`.

## 4. Otros conflictos del enunciado con el proyecto

1. **«Sin imports cruzados entre features».** Cuatro archivos de `features/tasks` usan los usuarios
   (`task-detail`, `task-form`, `task-list` y `task-toolbar`: el desplegable de responsable y el nombre en cada
   tarjeta). Una feature `usuarios` independiente chocaría con esa regla; los usuarios tendrían que quedarse en
   `core/`, apartándose del esquema del enunciado.
2. **Nombres.** El enunciado usa `tareas`, `Tarea` y `TareaService`; el proyecto usa `tasks`, `Task` y `TaskService`
   (los de la API). Aplicarlo literalmente implicaría traducir el dominio, que es otro refactor.
3. **Dependencia del Lab 11.2.** El enunciado supone que el 11.2 ya creó los modelos `Tarea` y `Usuario`. El 11.2
   está sin realizar (véase su [análisis](../../Lab%2011/Lab%2011.2/Analisis-aplicabilidad.md)) y comparte la misma
   dificultad: actúa sobre la misma aplicación.
4. **Errores del propio enunciado**, ya encontrados y documentados en el [Lab 12.1](../Lab%2012.1/talenthub/README.md):
   los barrels que mezclan tipos y valores en un mismo `export { … }` no compilan con `isolatedModules`, los alias
   sin `./` dan el error TS5090, y los barrels citan servicios que no existen.

## 5. Lo que el Lab 10 ya cumple, sin tocarlo

El objetivo del laboratorio (organizar por capas y features) ya está en gran parte en el Lab 10:

| Aspecto | Estado en el Lab 10 |
| --- | --- |
| Capas `core/`, `shared/` y `features/` | **Existen** (`features/home` y `features/tasks`) |
| Componentes con `OnPush` | **Todos** (0 infracciones) |
| `core/` y `shared/` sin depender de `features/` | **Cumple** (0 infracciones) |
| Barrel files | No hay |
| Alias de rutas (`@core`, `@features`…) | No hay |
| Rutas que cargan cada feature a través de su barrel | 6 infracciones, todas en `app.routes.ts`, que carga las pantallas apuntando a sus archivos internos |

Esos datos salen de aplicar al Lab 10, en modo solo lectura, la comprobación de arquitectura escrita para el Lab 12.1
(`scripts/check-architecture.mjs`).

## 6. ¿Mejoraría el Lab 12.2 la calidad del Lab 10?

**Sí, pero poco.** No haría falta empeorarlo antes de mejorarlo: el enunciado parte de una aplicación desordenada
(por eso enseña a ordenarla) y el Lab 10 ya está organizado, así que hay poco que "arreglar".

| Posible mejora | Medida | Valor |
| --- | --- | --- |
| Imports más cortos con los alias | 32 de los 35 imports con 3 o más `../` del código de la app (22 hacia `core`, 10 hacia `shared`) pasarían a `@core/…` y `@shared/…`; los 3 hacia `environments` no los cubren los alias | Legibilidad |
| Cohesión: lo propio de una feature, dentro de ella | `core/` mezcla infraestructura genérica con `task.service`, `user.service` y los dos modelos, que son de dominio. Moverlos ordena mejor las carpetas, aunque los usuarios seguirían en `core/` (apartado 4) | Orden |
| Límites explícitos entre features | Los 6 imports directos de `app.routes.ts` a archivos internos pasarían por rutas y barrels de cada feature | Mantenibilidad |

**Lo que el 12.2 no mejoraría:** los 2 errores de lint de accesibilidad y las 4 llamadas HTTP sin tipo (son del Lab
11.2), el tipado, la cobertura de los tests ni la seguridad. El proyecto ya compila con `tsc --strict`, tiene 221 tests
en verde y 0 vulnerabilidades en producción.

**Coste frente a beneficio:** a cambio de esas mejoras se tocaría el 47 % de los archivos y habría que rehacer la
evidencia de entrega (apartados 2 y 3), sin ningún cambio funcional. Para una práctica ya entregada, la relación es
baja. Si algún día se permitiera modificar el Lab 10, la parte de mayor valor y menor coste sería solo: las rutas por
feature con sus barrels, los alias y mover el modelo y el servicio de tareas a su feature.

## 7. Opciones consideradas

| Opción | Estado |
| --- | --- |
| **No realizar el Lab 12.2** y dejar constancia con este documento | **Adoptada** |
| Trabajar sobre una copia del Lab 10 | Técnicamente posible, pero duplica el proyecto (62 archivos) y su evidencia de entrega. No adoptada |
| Aplicar el enunciado sobre una aplicación de tareas propia de este itinerario, distinta del Lab 10 | Aplicable sin conflicto si algún día existe esa aplicación. Hoy no existe |

## 8. Relación con el Lab 11.2

El Lab 11.2 actúa sobre la misma aplicación y tiene la misma dependencia del Lab 10. Este documento no decide sobre
el 11.2, que sigue pendiente: si el Lab 10 tampoco debe modificarse allí, valdría el mismo razonamiento.

## Método (reproducible)

Se leyó `src/app` del Lab 10 con un script de solo lectura: se clasificó cada archivo `.ts` según el enunciado
(modelos, servicios de tareas y usuarios y `features/tasks` se mueven), se resolvieron sus imports relativos y se
contaron los archivos movidos, los editados y los imports que cambian de ruta. La situación de capas, `OnPush` y
barrels se midió con `scripts/check-architecture.mjs` del Lab 12.1. El Lab 10 no se modificó en ningún momento.
