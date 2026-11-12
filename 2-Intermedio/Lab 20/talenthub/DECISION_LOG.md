# Decision log — TalentHub (Lab 20)

Decisiones técnicas tomadas en la práctica final y su justificación. Primero, los cinco patrones de diseño del enunciado
(Cap. 10); después, las decisiones de arquitectura y de proceso.

## Patrones de diseño

### 1. Facade — `EmpleadosFacade` como única interfaz de los componentes

- **Dónde:** `features/empleados/services/empleados.facade.ts`, con `EmpleadoStateService` (el estado) y `EmpleadoService`
  (HTTP) detrás.
- **Qué hace:** expone el estado en solo lectura (`empleados`, `cargando`, `error`, `disponibles`, `ocupados`, `totalPorRol`)
  y reúne las operaciones (`cargar`, `obtenerPorId`, `darDeAlta`, `eliminar`), que orquestan servicio, estado y avisos.
- **Razón:** el directorio, el formulario de alta, el perfil (vía resolver) y el dashboard no saben de HTTP, de DTO ni de
  cómo se guarda el estado: si mañana el origen cambia, o el estado pasa a otra librería, los componentes no se tocan. Además,
  una operación como «dar de alta» toca tres cosas a la vez (crear, añadir a la lista, avisar) y quedan en un solo sitio.
- **Cómo se impone:** una regla de ESLint (`SOLO_FACHADA`) prohíbe que componentes y resolver importen el servicio o el estado.
- **Alternativa descartada:** inyectar `EmpleadoService` en los componentes: cada pantalla repetiría la orquestación y la
  lista del directorio no se actualizaría sola tras un alta.

### 2. Repository — `EmpleadoService` y `ProyectoService` abstraen el origen de los datos

- **Dónde:** `features/empleados/services/empleado.service.ts` y `features/proyectos/services/proyecto.service.ts`.
- **Qué hace:** son los únicos que conocen la URL, el formato de la API y los reintentos; devuelven siempre objetos de
  **dominio** (`Empleado`, `Proyecto`), nunca DTO. Deciden qué significa un error para el dominio (un 404 al pedir un empleado
  es «no existe» y devuelve `null`, no un fallo).
- **Razón:** el enunciado supone JSONPlaceholder hoy y una API real mañana; aquí el origen ya cambió una vez (de JSONPlaceholder al
  backend local) sin tocar ningún componente.
- **Consecuencia:** las pruebas de los componentes simulan el servicio, y las del servicio simulan solo HTTP.

### 3. Strategy — los filtros del directorio son estrategias intercambiables

- **Dónde:** `features/empleados/filtros/filtros-empleados.ts`: `filtrarPorRol(rol)` y `filtrarPorDisponibilidad(filtro)`,
  ambas con la firma `EstrategiaFiltro = (empleados) => Empleado[]`, y `combinar(...)`, que las encadena.
- **Razón:** el directorio no contiene la lógica de cada criterio: elige estrategias según los controles y las combina
  dentro de un `computed()`. Añadir un criterio (por ejemplo, por habilidad) es escribir otra función, sin tocar las demás ni
  el componente, y cada estrategia se prueba por separado.
- **Detalle:** devuelven siempre una copia y nunca modifican la lista de entrada, así que se pueden combinar en cualquier
  orden con el mismo resultado.

### 4. Adapter — `mapearEmpleado(dto)` y `mapearProyecto(dto)`

- **Dónde:** `features/empleados/mappers/empleado.mapper.ts` y `features/proyectos/mappers/proyecto.mapper.ts`.
- **Qué hace:** adaptan la forma de la API (`/users`: `name`, `role`, `skills`, `available`…; `/projects`: `name`, `client`, `status: 'paused'`…) al
  modelo de dominio (`nombre`, `rol`, `habilidades`, `estado: 'pausado'`…): traducen nombres y estados del inglés de la API al
  español del dominio, convierten los días `AAAA-MM-DD` en fechas locales y toleran un servidor que aún no trae algún dato.
- **Razón:** aísla al resto de la aplicación del formato de la API: si cambia, cambia solo el mapper. Los DTO no salen de la
  capa de mapeo (lo impone la regla `no-restricted-imports` de ESLint) y las funciones `leerEmpleado(s)` y `leerProyecto(s)`
  descartan lo que no tiene la forma esperada en la frontera.

### 5. Decorator — los interceptores HTTP

- **Dónde:** `core/interceptors/auth.interceptor.ts` y `error.interceptor.ts`, registrados con `withInterceptors([...])`.
- **Qué hacen:** envuelven cada petición sin que el código que la lanza lo sepa: el primero añade `Authorization: Bearer
  <token>` (solo hacia nuestra API) y el segundo traduce los fallos a un aviso comprensible. El orden importa: primero se
  añade el token y, a la vuelta, el interceptor de errores ve el fallo ya completo.
- **Razón:** el token y el aviso de errores son responsabilidades transversales; los servicios y componentes no las repiten.
  Una petición puede pedir un trato distinto con un `HttpContextToken` (`NOTIFICAR_404`: un 404 esperado no se avisa).

## Decisiones de arquitectura

### 6. Signals en lugar de `BehaviorSubject` para el estado

- **Razón:** `EmpleadoStateService` guarda el estado en `signal()` y lo expone con `asReadonly()`; el estado derivado
  (`disponibles`, `ocupados`, `totalPorRol`) son `computed()`. Hay menos código (no hace falta `async` ni suscribirse), la
  lectura es síncrona, compatible de forma nativa con `OnPush` y con `@defer`, y el estado derivado no se puede desincronizar.
- **Coste:** los flujos con tiempo (búsqueda con debounce, `switchMap`) siguen en RxJS y se puentean con `toSignal` y
  `toObservable`; se usa cada herramienta donde encaja.

### 7. Dependencias entre features acotadas, sin ciclos y comprobadas

- **Decisión:** el grafo permitido es `proyectos → (nada)`, `empleados → proyectos` y `dashboard → empleados, proyectos`, siempre
  por el barrel. `npm run check:architecture` falla si aparece otra arista (y sus 16 pruebas lo verifican, incluido el ciclo
  `proyectos → empleados`).
- **Razón:** el criterio de evaluación pide «sin imports cruzados». El perfil y el alta necesitan datos de proyectos, así que se
  admite esa única arista, en un solo sentido; lo contrario (el equipo de un proyecto necesita a las personas) se resuelve **sin
  importar `empleados`**: el equipo viene en el propio proyecto (`memberIds`) y sus nombres se leen de `/users?projectId=` en
  `ProyectoService.getEquipo`. Un ciclo entre barrels sería frágil (orden de evaluación de los módulos) y
  acoplaría las dos features.

### 8. Backend local en lugar de JSONPlaceholder

- **Razón:** JSONPlaceholder no guarda nada: un alta «real» no sobreviviría a recargar y los avisos de error no se podrían
  probar de verdad. El backend del repositorio (FastAPI + SQLite) guarda los cambios y valida igual que el formulario.
- **Consecuencia:** hay que arrancarlo antes (`start.cmd`). Las pruebas unitarias no lo necesitan (simulan HTTP). Lo que le
  faltaba para TalentHub se añadió al backend (decisión 9).

### 9. Adaptar el backend en lugar de simular los datos que le faltaban

- **Contexto:** la primera versión de la práctica simulaba en los mappers (a partir del id) lo que el backend no guardaba:
  rol, habilidades, disponibilidad, proyecto, clientes y equipos. Funcionaba, pero el alta solo conservaba el nombre y el email y,
  al recargar, la persona volvía a salir con datos inventados.
- **Decisión:** adaptar el backend (esquema v5): los usuarios pasan a ser empleados (`role`, `skills`, `available`, `projectId`,
  `hiredAt`) y se añade el recurso `/projects` con su equipo. Se hizo **aditivo**: todos los campos nuevos son opcionales y, en `PUT`, lo que
  el cuerpo no trae se conserva, así que el Lab 10 y el 10.1 del nivel Básico no notan el cambio (se comprobó con su contrato, con
  los dos en el navegador y con sus pruebas).
- **Razón:** los datos son reales y persisten, la regla «no disponible ⇒ proyecto» la impone también el servidor (la UI no es la
  única línea de defensa) y el frontend se quedó sin código de simulación. Un efecto colateral buscado: el equipo de un proyecto es
  una consulta (`/users?projectId=`), no un dato duplicado.
- **Coste:** hay que migrar la base de datos del repositorio (se hizo, y la migración se prueba) y mantener 73 pruebas más en el
  backend (232 en total).

### 10. Búsqueda en el servidor, con debounce y cancelación, y caché del último término

- **Decisión:** la búsqueda pide `/users?q=` a la API (300 ms de pausa, mínimo 2 caracteres, `distinctUntilChanged`) y la
  fachada cancela la petición anterior con `switchMap`; los filtros de rol y disponibilidad se aplican en el cliente sobre lo
  cargado. Si ya se pidió ese mismo término, la fachada no vuelve a pedirlo.
- **Razón:** con muchos empleados no conviene traerlos todos para buscar; el debounce evita una petición por tecla y
  `switchMap` descarta respuestas tardías. Filtrar en el cliente es inmediato y no genera tráfico. La caché hace que, tras un
  alta, volver al directorio muestre la lista actual sin otra petición.

### 11. `canMatch` para proteger las rutas y `resolver` para cargar antes de pintar

- **Decisión:** el guard de autenticación es un `CanMatchFn`; el perfil y el detalle de proyecto reciben sus datos de un
  `ResolveFn`.
- **Razón:** con `canMatch` la ruta protegida ni siquiera descarga su chunk sin sesión; con un resolver la pantalla nunca
  aparece vacía (o hay datos, o «no encontrado») y los fallos de red no rompen la navegación (devuelven `null`).

### 12. `@defer` para el desglose del dashboard

- **Decisión:** `@defer (on viewport; prefetch on idle)` con `@placeholder` y `@loading`.
- **Razón:** el desglose no es crítico para el primer pintado. **Coste medido:** el runtime de `@defer` añade unos 8,6 kB al
  bundle inicial, y el bloque en sí pesa 1,7 kB; con un bloque tan pequeño no compensa en tamaño, pero es lo que pide el RF-05 y
  se deja preparado para bloques mayores.

### 13. Proyecto independiente, con su propio `node_modules`

- **Decisión:** al ser la práctica final, TalentHub no forma parte del workspace de npm del nivel: tiene su `package.json`, su
  `package-lock.json` y su `node_modules`, con las mismas versiones que el resto del curso.
- **Razón:** se entrega y se puede evaluar por separado, sin depender de la estructura del repositorio. El coste es una
  instalación más (~700 paquetes).
