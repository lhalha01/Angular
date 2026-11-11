# TalentHub: router profesional (Lab 13.1)

**TalentHub** (Angular 20, standalone, `strict: true`) con navegación segura: rutas con carga diferida por feature,
guard de autenticación, resolver para el perfil de empleado y protección de cambios pendientes en el formulario de
alta. Parte del [Lab 12.1](../../../Lab%2012/Lab%2012.1/talenthub/README.md) (estructura por features, barrels y
alias) y añade el router, la pantalla de login, el armazón `Shell` y lo mínimo de datos para recorrerlo.

El enunciado está en [`../Lab 13.1.md`](../Lab%2013.1.md) (extraído de la primera mitad de `Lab 13.md`) y el briefing
completo del proyecto, en el [Lab 20](../../Lab%2020/Lab%2020.md).

## Instalación y ejecución

El proyecto forma parte del workspace del nivel Intermedio (`2-Intermedio`), que comparte un único `node_modules`.
**TalentHub usa siempre el backend local** (`/users`), así que hay que arrancarlo antes:

```bash
# 1. backend (desde la carpeta backend/ del repositorio; necesita Python 3.11 o superior)
.\start.cmd               # Windows;  en Linux/macOS: ./start.sh

# 2. aplicación
cd 2-Intermedio
npm install               # una sola vez para todo el nivel (o npm ci)
cd "Lab 13/Lab 13.1/talenthub"
npm start                 # http://localhost:4200/  (cualquier email y contraseña sirven en el login)
```

Sin el backend, el directorio muestra «No se pudieron cargar los empleados. ¿Está arrancado el backend?».

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                  # tipos
npm run lint                                               # ESLint: 0 errores
npm run check:architecture                                 # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                  # tests de esa comprobación (13)
npx ng build                                               # compilación
npx ng test --watch=false --browsers=ChromeHeadless        # 93 tests, 100 % de líneas (no necesitan el backend)
```

## Qué hay de nuevo respecto al Lab 12.1

```text
src/app/
├── app.routes.ts                 login + armazón protegido (canMatch) con un chunk lazy por feature
├── core/
│   ├── services/auth.service     sesión simulada: token opaco en sessionStorage
│   ├── guards/auth.guard         CanMatchFn: sin sesión → /login?returnUrl=<destino>
│   ├── guards/cambios-pendientes.guard   CanDeactivateFn: confirm() si el componente tiene cambios sin guardar
│   ├── login/                    pantalla de acceso (vuelve a returnUrl, solo si es una ruta interna)
│   └── layout/shell              armazón de las pantallas protegidas: navbar + contenido + footer
└── features/
    ├── dashboard/dashboard.routes.ts, proyectos/proyectos.routes.ts
    └── empleados/
        ├── empleados.routes.ts   '' directorio · 'nuevo' alta (con guard) · ':id' perfil (con resolver)
        ├── resolvers/empleado.resolver.ts
        ├── services/empleado.service.ts      getAll y getById contra /users del backend local
        └── components/           directorio · perfil · formulario-alta
```

| Criterio del enunciado | Cómo se cumple |
| --- | --- |
| `/dashboard` sin token redirige a `/login?returnUrl=%2Fdashboard` | `authGuard` (`canMatch`); probado en `app.routes.spec.ts` y en el navegador |
| Tras el login, `/empleados` carga el chunk lazy | Un chunk por feature (`empleados-routes`, `dashboard-routes`, `proyectos-routes`) más `shell-component` y `login-component`; véase la captura de Network |
| `/empleados/1` recibe los datos desde el resolver | `empleadoResolver`; el componente lee `route.data` y nunca aparece vacío (si no existe, «Empleado no encontrado») |
| El formulario de alta pide confirmación con cambios sin guardar | `cambiosPendientesGuard` + `FormularioAlta.tieneCambiosPendientes()` |

## Desviaciones respecto al enunciado

1. **`authGuard` es un `CanMatchFn`, no un `CanActivateFn`.** El enunciado lo escribe como `CanActivateFn` leyendo
   `state.url` y lo usa en `canMatch`, donde el segundo argumento son los segmentos y no el estado: no compilaría y
   `returnUrl` quedaría vacío. La URL de destino se toma de la navegación en curso (`extractedUrl`) y, si no hay, de
   los segmentos. Con `canMatch`, además, el chunk de las pantallas protegidas **no se descarga** sin sesión.
2. **`returnUrl` conserva lo que el usuario escribió** (`/` o `/no-existe`, no el destino final tras las
   redirecciones): al entrar se aplican las mismas redirecciones. Y el login **solo acepta destinos internos**
   (`/ruta`), para que un `returnUrl` manipulado no redirija a otro sitio.
3. **Nombres.** Los componentes siguen los nombres que usan los laboratorios siguientes (`DirectorioEmpleados`,
   `FormularioAlta`, `Login`, `Shell`, rutas `components/directorio/…`), no los `…Component` de las rutas del
   enunciado, y `PerfilEmpleado` es nuevo.
4. **Datos mínimos para poder navegar.** `EmpleadoService` hace `getAll` y `getById` contra `/users` del backend
   local (con el mapper y una lectura validada: descarta lo que no tiene forma de usuario, y `getById` devuelve
   `null` en 404). El resto de la capa HTTP (interceptores, errores, reintentos) es del Lab 14.
5. **`FormularioAlta` es un esqueleto**: solo lleva nombre y email, para poder tener cambios pendientes. El guardado
   y los Reactive Forms llegan en los Labs 14, 16 y 17.
6. **`ListaProyectos` y `Dashboard` son marcadores** (los datos llegan después). Cada uno tiene su archivo de rutas.
7. **`login(_email, _password)` ignora sus argumentos** (sesión simulada); por eso la regla `no-unused-vars` de ESLint
   admite parámetros que empiezan por `_`.
8. **El `Shell` es una ruta**, no parte de `App`: así el login se ve sin menú. `App` solo contiene el `router-outlet`.
9. **La barra de navegación tiene «Cerrar sesión»**, que el enunciado no pide pero hace falta para poder probar el guard.
10. **`confirm()` nativo** en `cambiosPendientesGuard`, tal como lo escribe el enunciado.

## Evidencias

En [`../evidencias/`](../evidencias/): [`network-chunks-lazy.png`](../evidencias/network-chunks-lazy.png) (peticiones
reales que registra Chrome en el recorrido: cada chunk lazy se descarga solo al navegar a su pantalla),
[`guards-en-accion.png`](../evidencias/guards-en-accion.png) (el guard de login y la confirmación del formulario) y
[`resolver-perfil.png`](../evidencias/resolver-perfil.png). Son imágenes generadas con los datos reales de un
recorrido automatizado en Chrome contra el build de producción, no capturas de las DevTools.

## Notas del enunciado

El enunciado pide entregar en la rama `lab-13-router`. En este repositorio el trabajo se sube a `main`.
