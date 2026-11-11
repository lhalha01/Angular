# TalentHub: RxJS aplicado (Lab 15.1)

**TalentHub** (Angular 20, standalone, `strict: true`) con el **directorio de empleados reactivo**: búsqueda en tiempo
real (`debounceTime` + `distinctUntilChanged` + `switchMap`), filtros combinados por rol y disponibilidad (`computed`) y
protección de doble envío en el formulario de alta (`exhaustMap`). Parte del
[Lab 14.1](../../../Lab%2014/Lab%2014.1/talenthub/README.md) (HTTP, interceptores y avisos).

El enunciado está en [`../Lab 15.1.md`](../Lab%2015.1.md) (extraído de la primera mitad de `Lab 15.md`) y el briefing
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
cd "Lab 15/Lab 15.1/talenthub"
npm start                 # http://localhost:4200/  (cualquier email y contraseña sirven en el login)
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                  # tipos
npm run lint                                               # ESLint: 0 errores
npm run check:architecture                                 # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                  # tests de esa comprobación (13)
npx ng build                                               # compilación
npx ng test --watch=false --browsers=ChromeHeadless        # 174 tests, 100 % de líneas (no necesitan el backend)
```

## Qué hay de nuevo respecto al Lab 14.1

```text
features/empleados/
├── components/directorio/        búsqueda reactiva + filtros combinados + resumen (disponibles)
├── components/formulario-alta/   envío con Subject + exhaustMap + takeUntilDestroyed; guarda de verdad (POST /users)
├── models/empleado.model.ts      + ROLES_EMPLEADO (lista de roles para los filtros)
└── services/empleado.service.ts  getAll(termino?) → GET /users?q=<termino>
```

| Criterio del enunciado | Cómo se cumple |
| --- | --- |
| Escribir en el buscador no lanza una petición por cada tecla (debounce 300 ms) | `debounceTime(300)`; la captura de Network muestra 6 pulsaciones → **1 petición**, ≈300 ms después de la última |
| Los filtros de rol y disponibilidad se combinan con la búsqueda en tiempo real | `empleadosFiltrados` es un `computed` sobre el resultado de la búsqueda; cambiarlos no hace peticiones |
| «Dar de alta» no crea duplicados aunque se pulse varias veces rápido | `exhaustMap` descarta los envíos que llegan con uno en curso (y el botón se desactiva); probado en los tests |
| No hay `ngOnDestroy` ni `unsubscribe()` manual en el código nuevo | El directorio usa `toSignal` y el formulario `takeUntilDestroyed()`; no hay ningún otro `subscribe()` en el código de la aplicación |

## Desviaciones respecto al enunciado

1. **La búsqueda la hace la API** (`GET /users?q=`, que busca en nombre, usuario y email), no el cliente. El enunciado
   pide pedir `getAll()` en cada término y filtrar después por nombre en el cliente; aquí el término viaja a la API,
   que ya sabe buscar. Así cada término distinto es una petición de verdad (la que `switchMap` cancela si llega otra) y
   se ve el efecto del debounce en Network.
2. **Con menos de 2 caracteres no se busca** (se muestra el directorio completo), como en el enunciado. El término se
   recorta y se normaliza **antes** del `debounceTime`: teclear una sola letra, o un espacio al final, no repite la carga.
3. **La primera carga espera 300 ms** (el debounce también afecta a la primera emisión); mientras tanto se ve «Cargando».
4. **El estado de la carga** (`cargando`, `error`, `ok`) sale del mismo flujo (`startWith` + `catchError`) y el error lo
   avisa el interceptor, no el componente.
5. **Los filtros de rol y disponibilidad se aplican en el cliente**, porque la API no los ofrece. Ojo con los datos:
   el mapper (Lab 11) pone a todos los empleados el rol `desarrollador` y calcula la disponibilidad por el id (pares
   disponibles), así que solo ese rol y esas disponibilidades tienen datos hasta que la API los tenga.
6. **El formulario de alta es mínimo** (nombre y email, que el backend exige); los Reactive Forms, los validadores y el
   resto de campos son del Lab 16. Rol, habilidades y disponibilidad van por defecto. **El alta es real**: crea el
   usuario en el backend (SQLite). Por eso el flujo se avisa con «incorporado correctamente» y se vuelve al directorio.
7. **El error no termina el flujo.** El enunciado pone el manejador de errores en el `subscribe` exterior, donde un solo
   fallo cerraría el `Subject` para siempre (los siguientes envíos se ignorarían). Aquí el `catchError` está **dentro**
   del `exhaustMap`, de modo que tras un fallo se puede volver a intentar; el aviso lo da el interceptor.
8. **Tras el alta no se pide confirmar al salir.** Una vez creado el empleado, el formulario deja de tener cambios
   pendientes, así que el guard de cambios sin guardar no pregunta.
9. **Fase 3 (sin suscripciones manuales):** ya se cumplía: ningún componente de TalentHub hace `subscribe()` a mano; la
   única suscripción es la del `Subject` del formulario, cerrada con `takeUntilDestroyed()`, que es lo que pide el enunciado.

## Evidencias

En [`../evidencias/`](../evidencias/): [`network-debounce.png`](../evidencias/network-debounce.png) (línea de tiempo real
de teclas y peticiones; el `.txt` lleva los mismos datos), [`busqueda.png`](../evidencias/busqueda.png) y
[`filtros-sin-peticiones.png`](../evidencias/filtros-sin-peticiones.png) (capturas reales de la aplicación). Salen de un
recorrido automatizado en Chrome contra el build de producción y el backend local, no de las DevTools.

## Notas del enunciado

El enunciado pide entregar en la rama `lab-15-rxjs`. En este repositorio el trabajo se sube a `main`.
