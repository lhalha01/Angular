# TalentHub: testing pragmático (Lab 18.1)

**TalentHub** (Angular 20, standalone, `strict: true`) con la cobertura de sus cuatro artefactos más críticos comprobada y
documentada: `EmpleadoService`, `authGuard`, el validador de email único y `DirectorioEmpleados`. Parte del
[Lab 17.1](../../../Lab%2017/Lab%2017.1/talenthub/README.md); el código de la aplicación no cambia, solo se añaden pruebas.

El enunciado está en [`../Lab 18.1.md`](../Lab%2018.1.md) (extraído de la primera mitad de `Lab 18.md`) y el briefing
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
cd "Lab 18/Lab 18.1/talenthub"
npm start                 # http://localhost:4200/  (cualquier email y contraseña sirven en el login)
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                            # tipos
npm run lint                                                         # ESLint: 0 errores
npm run check:architecture                                           # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                            # tests de esa comprobación (13)
npx ng build                                                         # compilación (initial total 298,31 kB, igual que el 17.1)
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage  # 245 tests, 100 % de líneas (no necesitan el backend)
```

## Qué hay de nuevo respecto al Lab 17.1

Solo una prueba nueva, `directorio.component.facade-simulada.spec.ts`: el directorio con la **fachada simulada** (un doble
con señales que controla el test), como propone la Fase 4. Las demás pruebas que pide el enunciado ya existían, porque cada
laboratorio anterior se entregó con sus tests (el servicio, el guard y los validadores desde los Labs 14 a 16).

| Criterio del enunciado | Cómo se cumple |
| --- | --- |
| `ng test --code-coverage` muestra > 70 % en `features/empleados/services/` | 100 % de líneas, funciones y ramas en `empleado.service.ts`, `empleado-state.service.ts` y `empleados.facade.ts` |
| `authGuard` tiene cobertura del 100 % | `auth.guard.ts`: 100 % (permite con sesión, redirige con `returnUrl`, conserva los segmentos) |
| Los dos casos del validador async pasan | `validators.spec.ts`: marca «test» como duplicado y acepta los demás emails (null), con las pausas de 400 ms simuladas con `fakeAsync` |
| `DirectorioEmpleados` tiene al menos 2 tests | 5 con la fachada simulada (`directorio.component.facade-simulada.spec.ts`) y el resto, con la fachada y el estado reales (`directorio.component.spec.ts`) |

## Desviaciones respecto al enunciado

1. **`provideHttpClient()` + `provideHttpClientTesting()` en lugar de `HttpClientTestingModule`**, que está obsoleto desde
   Angular 18.
2. **El guard es un `CanMatchFn`** (el enunciado lo escribe como `CanActivateFn` y con `AuthService.estaAutenticado` simulado
   con `createSpyObj`). Sus pruebas usan el `AuthService` real y comprueban el `UrlTree` con `returnUrl`; no basta con
   `not.toBeTrue()`, que aceptaría cualquier cosa.
3. **El validador no emite `{ emailDuplicado: true }` con `done`**: sus pruebas usan `fakeAsync` y `tick(400)`, que
   además comprueban la espera.
4. **`EmpleadoService` se prueba contra el backend local** (`/users`), con `HttpTestingController`: el mapeo del DTO, el 404
   → `null`, los reintentos, la búsqueda y el alta, no solo el caso del enunciado.
5. **El directorio se prueba de dos maneras**: con la fachada simulada (aislamiento: solo lo que el componente hace con las
   señales y con `cargar`) y con la fachada y el estado reales (integración: debounce, `switchMap`, filtros). Son
   complementarias.
6. **La cobertura ya era alta antes del laboratorio** (100 % de líneas). El laboratorio no persigue subirla, sino dejar
   documentado que los artefactos críticos están cubiertos y con qué pruebas.
7. **La evidencia es la salida real de `ng test --code-coverage`** y una tabla con la cobertura de cada artefacto sacada
   del informe generado; no es una captura de la ventana del terminal.

## Evidencias

En [`../evidencias/`](../evidencias/): [`cobertura-karma.png`](../evidencias/cobertura-karma.png) (resumen de cobertura de
Karma y cobertura de los cuatro artefactos) y `cobertura.txt` (el mismo contenido en texto).

## Notas del enunciado

El enunciado pide entregar en la rama `lab-18-testing`. En este repositorio el trabajo se sube a `main`.
