# TalentHub: estado de aplicación con Signals y fachada (Lab 17.1)

**TalentHub** (Angular 20, standalone, `strict: true`) con el estado de la feature `empleados` centralizado en un
`EmpleadoStateService` (Signals) y expuesto a los componentes mediante una `EmpleadosFacade`. Los componentes ya no
hablan con el servicio HTTP. Parte del [Lab 16.1](../../../Lab%2016/Lab%2016.1/talenthub/README.md).

El enunciado está en [`../Lab 17.1.md`](../Lab%2017.1.md) (extraído de la primera mitad de `Lab 17.md`) y el briefing
completo del proyecto, en el [Lab 20](../../Lab%2020/Lab%2020.md).

## Instalación y ejecución

El proyecto forma parte del workspace del nivel Intermedio (`2-Intermedio`), que comparte un único `node_modules`.
**TalentHub usa siempre el backend local** (`/users` y `/todos`), así que hay que arrancarlo antes:

```bash
# 1. backend (desde la carpeta backend/ del repositorio; necesita Python 3.11 o superior)
.\start.cmd               # Windows;  en Linux/macOS: ./start.sh

# 2. aplicación
cd 2-Intermedio
npm install               # una sola vez para todo el nivel (o npm ci)
cd "Lab 17/Lab 17.1/talenthub"
npm start                 # http://localhost:4200/  (cualquier email y contraseña sirven en el login)
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                  # tipos
npm run lint                                               # ESLint: 0 errores
npm run check:architecture                                 # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                  # tests de esa comprobación (13)
npx ng build                                               # compilación (initial total 298,31 kB; en el 16.1, 298,13 kB)
npx ng test --watch=false --browsers=ChromeHeadless        # 240 tests, 100 % de líneas (no necesitan el backend)
```

## Qué hay de nuevo respecto al Lab 16.1

```text
src/app/features/empleados/services/
├── empleado-state.service.ts   Signals privados (_empleados, _cargando, _error) + asReadonly + computed
├── empleados.facade.ts         lo único que ven los componentes: estado de solo lectura + cargar/darDeAlta/eliminar
└── empleado.service.ts         HTTP (sin cambios); solo lo usa la fachada
```

- **`EmpleadoStateService`**: `empleados`, `cargando` y `error` son de solo lectura hacia fuera; `disponibles`, `ocupados`
  y `totalPorRol` son `computed()` (`totalPorRol` deja a 0 los roles sin empleados). Se modifica solo con `setEmpleados`,
  `setCargando`, `setError`, `agregar`, `eliminar` y `actualizar` (siempre arrays nuevos, sin mutar).
- **`EmpleadosFacade`**: reexpone el estado y orquesta servicio + estado + avisos. `DirectorioEmpleados`,
  `FormularioAltaEmpleado` y el resolver `empleadoResolver` inyectan solo la fachada.
- Una regla de ESLint (`SOLO_FACHADA`) impide que los componentes y el resolver de `empleados` importen
  `empleado.service` o `empleado-state.service`; los tests sí pueden (para simularlos).

| Criterio del enunciado | Cómo se cumple |
| --- | --- |
| Los componentes solo inyectan `EmpleadosFacade` | directorio, formulario de alta y resolver; lo garantiza la regla `SOLO_FACHADA` |
| `disponibles`, `ocupados` y `totalPorRol` son `computed()` | `EmpleadoStateService`; pruebas en `empleado-state.service.spec.ts` |
| Dar de alta actualiza la lista sin recargar desde la API | `darDeAlta` hace `POST` y `state.agregar`; en la evidencia, `GET /users` sigue en 1 tras el alta |
| `ng build` sin regresiones de tamaño | initial total 298,31 kB frente a 298,13 kB del 16.1 |
| Captura de los Signals del StateService | [`estado-signals.png`](../evidencias/estado-signals.png) (ver «Evidencias») |

## Desviaciones respecto al enunciado

1. **Se mantiene `EmpleadoService` en el barrel** de la feature (`index.ts`) además de exportar la fachada: hoy solo
   lo usa la fachada, pero retirarlo de la API pública de la feature no forma parte de este laboratorio.
2. **`cargar(termino = '')` admite búsqueda.** El directorio del Lab 15.1 busca en la API con debounce; la fachada recibe
   el término y usa un `Subject` + `switchMap`, de modo que una carga nueva cancela la anterior y su respuesta tardía se
   ignora. Si el término ya está cargado (y sin error) no se vuelve a pedir, de modo que al volver al directorio tras un
   alta no hay otra petición; `recargar()` (o `forzar`) fuerza una carga nueva.
3. **Si la carga falla** el mensaje es fijo («No se pudieron cargar los empleados.», el enunciado guarda `err.message`) y se
   conserva la lista que hubiera; el aviso emergente lo da el interceptor de errores.
4. **`eliminar(id)` devuelve `Promise<boolean>`** (`false` si falla) en lugar de avisar por su cuenta: el interceptor ya
   muestra el error HTTP y duplicarlo daría dos avisos. `darDeAlta` devuelve el empleado creado y rechaza si falla (así el
   formulario puede dejar el flujo abierto).
5. **`obtenerPorId(id)`** se añade a la fachada para que el resolver tampoco necesite el servicio.
6. **El formulario de alta no avisa por su cuenta**: el aviso de éxito lo da `darDeAlta`, como pide el enunciado.
7. **La evidencia no es una captura de Angular DevTools** (no se puede automatizar la extensión): se lee cada Signal
   del estado en la aplicación en ejecución (build de desarrollo, a través de la fachada del componente) y se muestra
   junto a la pantalla real.

## Evidencias

En [`../evidencias/`](../evidencias/): [`estado-signals.png`](../evidencias/estado-signals.png) muestra, antes y después de
dar de alta a «Marta Ruiz» (QA) desde la propia aplicación, la pantalla y el valor real de `empleados()`, `cargando()`,
`error()`, `disponibles()`, `ocupados()` y `totalPorRol()`; `evidencias.txt` resume los datos y las peticiones al backend
(el alta solo genera `POST /users`; filtrar por rol no hace peticiones). El recorrido se hizo con un backend con una base de
datos temporal (`BACKEND_DB`), así que `backend/data/app.db` no cambia.

## Notas del enunciado

El enunciado pide entregar en la rama `lab-17-estado`. En este repositorio el trabajo se sube a `main`.
