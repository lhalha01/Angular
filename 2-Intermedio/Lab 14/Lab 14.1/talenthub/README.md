# TalentHub: HTTP y capa de datos (Lab 14.1)

**TalentHub** (Angular 20, standalone, `strict: true`) conectado a la API: `EmpleadoService` y `ProyectoService` con
mapeo de DTOs al dominio, interceptores de autenticación y de errores, reintentos con espera y avisos al usuario
sin que los componentes gestionen los errores. Parte del [Lab 13.1](../../../Lab%2013/Lab%2013.1/talenthub/README.md)
(router, login y guards).

El enunciado está en [`../Lab 14.1.md`](../Lab%2014.1.md) (extraído de la primera mitad de `Lab 14.md`) y el briefing
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
cd "Lab 14/Lab 14.1/talenthub"
npm start                 # http://localhost:4200/  (cualquier email y contraseña sirven en el login)
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                  # tipos
npm run lint                                               # ESLint: 0 errores
npm run check:architecture                                 # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                  # tests de esa comprobación (13)
npx ng build                                               # compilación
npx ng test --watch=false --browsers=ChromeHeadless        # 148 tests, 100 % de líneas (no necesitan el backend)
```

## Qué hay de nuevo respecto al Lab 13.1

```text
src/app/
├── app.config.ts                 provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor]))
├── core/
│   ├── interceptors/             auth.interceptor (Authorization: Bearer), error.interceptor (avisos por código de
│   │                             estado), http-context (NOTIFICAR_404)
│   ├── http/reintentar.ts        reintentarConEspera(): 2 reintentos, 1 s y 2 s, solo si el fallo es pasajero
│   ├── services/notificacion     avisos (exito, error, info), sin repetir el mismo mensaje mientras está visible
│   └── layout/notificaciones     zona de avisos, en la raíz de la aplicación
└── features/
    ├── empleados/   services/empleado.service (getAll, getById, crear, eliminar) · mappers (DTO ↔ dominio)
    └── proyectos/   mappers/ (proyecto.dto, proyecto.mapper) · services/proyecto.service · lista de proyectos
```

| Criterio del enunciado | Cómo se cumple |
| --- | --- |
| El directorio muestra los 10 usuarios mapeados al dominio | `getAll()` → `leerEmpleados` (DTO → `Empleado`); véase `directorio-10-usuarios.png` |
| El token se envía en `Authorization` | `authInterceptor`; véase `network-authorization.png` (solo a nuestra API, nunca a terceros) |
| Los errores se notifican sin que el componente los gestione | `errorInterceptor` + `NotificacionService`; los componentes no tienen `catchError` para avisar |
| `/empleados/999` devuelve `null` sin romper la aplicación | `getById` convierte el 404 en `null`; el perfil muestra «no encontrado» y no sale ningún aviso (`empleado-999.png`) |

## Desviaciones respecto al enunciado

1. **API local en lugar de JSONPlaceholder.** Los empleados vienen de `/users` y los proyectos de `/todos` del
   backend propio (la regla del nivel es usar siempre las APIs locales). El resto del diseño es el del enunciado.
   El backend exige `name` y `email` en el alta: `aNuevoEmpleadoDto` los traduce desde `NuevoEmpleado`; lo demás
   (rol, habilidades…) se conserva del argumento, porque la API no lo guarda.
2. **El 404 de `getById` no genera aviso.** El enunciado pide que el interceptor gestione el 404, pero también que
   `/empleados/999` «devuelva `null` sin romper»: un aviso de error por algo esperado sería ruido. La petición lo marca
   con un `HttpContextToken` (`NOTIFICAR_404 = false`); cualquier otro 404 sí se avisa.
3. **Un solo aviso al reintentar.** Cada reintento vuelve a pasar por el interceptor; `NotificacionService` no repite
   un mensaje que sigue visible, así que los 3 intentos fallidos dan 1 aviso y no 3.
4. **El 401 cierra la sesión y lleva al login** recordando la pantalla (`returnUrl`), si no se estaba ya en el login.
5. **Los reintentos solo cubren `getAll`**, como pide el enunciado, y solo para fallos pasajeros (sin conexión o 5xx);
   un 4xx no se reintenta. Las escrituras (`crear`, `eliminar`) no se reintentan.
6. **`ProyectoService` convierte tareas en proyectos**: el nombre es el título, el cliente se deriva del usuario
   (`Cliente N`), el estado sale de `completed` y la fecha de inicio es la de creación de la API. Son derivaciones
   documentadas en el mapper (la API no tiene clientes ni estados de proyecto). La lista de proyectos, que el
   enunciado no pide, muestra su nombre y estado para poder comprobar el servicio.
7. **Lectura validada.** Los servicios usan `get<unknown>` y los mappers validan la forma (descartan lo que no encaja);
   el enunciado tipa directamente con `get<EmpleadoDto[]>`.
8. **`eliminar` borra también las tareas del usuario** en el backend (borrado en cascada). El servicio existe, pero
   ninguna pantalla lo usa todavía (la interfaz llega en el Lab 17), y las pruebas no tocan la base de datos real.

## Evidencias

En [`../evidencias/`](../evidencias/): [`network-authorization.png`](../evidencias/network-authorization.png)
(peticiones reales a la API con la cabecera `Authorization`; el `OPTIONS` previo de CORS no la lleva, como es normal),
[`directorio-10-usuarios.png`](../evidencias/directorio-10-usuarios.png) y
[`empleado-999.png`](../evidencias/empleado-999.png). Son imágenes generadas con los datos de un recorrido
automatizado en Chrome contra el build de producción, no capturas de las DevTools (las dos últimas son capturas de
pantalla reales de la aplicación).

## Notas del enunciado

El enunciado pide entregar en la rama `lab-14-http`. En este repositorio el trabajo se sube a `main`.
