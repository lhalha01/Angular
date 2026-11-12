# Decision log — Refactor de TalentHub (Lab 20.1)

Una entrada por decisión del refactor, con su justificación técnica. Los datos (antes/después) están en [`AUDIT.md`](./AUDIT.md);
las deficiencias son las D-01 a D-08 del enunciado. Los patrones de diseño de la práctica final están en el
[`DECISION_LOG.md` del Lab 20](../../Lab%2020/talenthub/DECISION_LOG.md); aquí solo se recogen las decisiones del refactor.

## 1. Medir antes de tocar: auditoría con herramientas y un recuento propio de la deuda

- **Decisión:** antes de cambiar nada se midió la base con `ng lint`, `tsc --strict`, `ng test --code-coverage`, `ng build --stats-json`
  y `check:architecture`, y se escribió `scripts/audit-debt.mjs`, que cuenta cada deficiencia D-01 a D-08 en el código fuente
  (`npm run audit:debt`).
- **Razón:** las herramientas estándar no ven todo (la configuración de ESLint de la base no detectaba ni los componentes sin `OnPush` ni
  los `*ngFor`; la cobertura global del 91 % escondía un servicio al 25 %). Un recuento propio y repetible convierte «mejoró» en un
  número, y se puede ejecutar en la integración continua para que la deuda no vuelva.
- **Alternativa descartada:** contar a mano o fiarse solo del `ng lint`: no es reproducible y dejaría D-02, D-06 y D-08 sin medir.

## 2. D-01 — Tipar la frontera de la API con DTO, mappers y type guards, en vez de `any`

- **Decisión:** las respuestas HTTP se leen como `unknown`; un type guard comprueba la forma mínima (`esEmpleadoDto`, `esProyectoDto`) y un
  mapper (`mapearEmpleado`, `mapearProyecto`) las traduce al dominio. Lo que no encaja se descarta (`leerEmpleados` devuelve solo los
  válidos). El resto de la aplicación solo ve `Empleado` y `Proyecto`.
- **Razón:** `any` apaga el compilador justo donde más falla: en los datos que vienen de fuera. Con `unknown` el compilador obliga a
  comprobar; con el guard, un servidor que cambie de formato produce una lista vacía o un error controlado, no un `undefined` en la
  pantalla. Es lo que pide la Fase 2 (interfaces, sin `any`, mappers aislados y `tsc --strict` en 0).
- **Consecuencia:** más archivos (`*.dto.ts`, `*.mapper.ts`) pero cada uno es pequeño y se prueba solo; el patrón es Adapter.

## 3. D-01/D-07 — Los DTO no salen de la capa de mapeo (regla de ESLint)

- **Decisión:** `no-restricted-imports` prohíbe importar `*.dto` salvo desde un `*.mapper.ts` (y sus pruebas).
- **Razón:** si el DTO se filtra, el formato de la API se acopla a toda la aplicación y el mapper deja de ser el único sitio que cambia.

## 4. D-03 — Migrar el guard de clase a función, y usar `canMatch` en lugar de `canActivate`

- **Decisión:** `AuthGuard` (clase `implements CanActivate`, inyección por constructor) pasa a `authGuard` (función con `inject()`), y las
  rutas protegidas lo usan como `canMatch`, no como `canActivate`. La función recibe `(route, segments)` y calcula el `returnUrl` de la
  navegación en curso.
- **Razón:** los guards de clase están obsoletos (Angular 15+ recomienda funciones: sin boilerplate, componibles y fáciles de probar con
  `runInInjectionContext`). El cambio a `canMatch` no estaba en el enunciado, pero la auditoría mostró un fallo real de `canActivate`: tras
  cerrar la sesión, navegar entre rutas hijas del armazón **no vuelve a pasar por el guard** (queda abierta) y el chunk de la ruta se descarga
  antes de comprobar la sesión. Con `canMatch` el guard se evalúa en cada coincidencia de ruta y el chunk no se descarga sin sesión.
- **Desviación del enunciado:** la Fase 4 escribe un `CanActivateFn` con `state.url`; aquí es un `CanMatchFn`. Una prueba nueva (cerrar la
  sesión y volver a proteger las rutas) falla con la base y pasa con el refactor.

## 5. D-05 — Validadores a `shared/validators/`, cada uno con sus pruebas

- **Decisión:** el patrón del nombre, el email único (asíncrono, simulado: duplicado si contiene «test»; 400 ms de espera) y el validador
  cruzado (no disponible ⇒ proyecto) pasan a archivos propios, y se añaden `sinEspacios` y `noSoloEspacios` (que `Validators.required`
  no cubre: «   » no está vacío). Cada validador tiene casos positivos y negativos.
- **Razón:** una validación dentro del componente no se puede reutilizar ni probar sin montar el formulario. Un validador suelto es una
  función pura (o casi): se prueba con un `FormControl` y se reutiliza en cualquier formulario. Los validadores devuelven válido ante un
  valor vacío, para que de exigir el campo se encargue solo `required` y no salgan dos errores a la vez.

## 6. D-07 — Imports solo por el barrel, y un grafo de dependencias entre features comprobado

- **Decisión:** cada feature se importa por su `index.ts`. `check:architecture` comprueba la regla `barrel` y una regla `features` con el
  grafo permitido: `proyectos` no depende de ninguna, `empleados` usa a `proyectos` y `dashboard` compone a las dos (sin ciclos). El resto
  de dependencias falla.
- **Razón:** un import a un archivo interno acopla una feature a la estructura de otra: renombrar una carpeta rompe a un tercero. El
  barrel es la API pública y el único lugar que hay que mantener estable. Fijar el grafo evita además los ciclos entre barrels, que son frágiles.
- **Complemento:** ESLint (`no-restricted-imports`) lo señala en el editor; `check:architecture` cubre lo que ESLint no ve y falla la integración continua.

## 7. D-08 — Suscripciones: `toSignal()` si es posible, `takeUntilDestroyed()` si no, y sin `ngOnDestroy`

- **Decisión:** las lecturas que llegan a la plantilla (`route.data`, el equipo del proyecto, el total de proyectos activos, la lista de
  proyectos, la búsqueda) pasan a `toSignal()`; el único `subscribe()` que queda es el envío del formulario (efecto, no dato), con
  `takeUntilDestroyed()`. Se eliminan los dos `ngOnDestroy` con `Subscription` que ya no hacen falta.
- **Razón:** `toSignal` se suscribe y se da de baja solo (y entrega un valor sincronizado con la plantilla y compatible con `OnPush`);
  `takeUntilDestroyed` cancela al destruir el componente. Una suscripción manual sin cancelar fuga memoria y, peor, sigue ejecutando
  efectos sobre un componente que ya no existe (en el formulario, una vez destruido seguía atendiendo envíos).
- **Prueba:** hay una que destruye el componente y comprueba que ya no atiende envíos; falla con la base.

## 8. D-02 — `OnPush` en todos los componentes, impuesto por ESLint

- **Decisión:** los 17 componentes llevan `ChangeDetectionStrategy.OnPush` y la regla `@angular-eslint/prefer-on-push-component-change-detection`
  (error) impide que vuelva a faltar.
- **Razón:** con `Default`, cada evento de la aplicación revisa todos los componentes. Con `OnPush` solo se revisan los que reciben un
  `@Input` nuevo, un evento propio o una señal que cambia. Como el estado ya vive en Signals, el cambio es seguro; las pruebas siguen en verde.

## 9. D-06 — `@for … track item.id` y control de flujo nuevo, sin `*ngFor` ni `*ngIf`

- **Decisión:** todos los bucles usan `@for` con `track` (el id del empleado o del proyecto; el valor en las listas fijas; el control en el
  `FormArray`), con `@empty` en lugar de un `*ngIf` aparte; y se sustituyen también los `*ngIf` (regla `template/prefer-control-flow`).
- **Razón:** sin `track`/`trackBy`, Angular destruye y recrea el DOM de toda la lista al cambiar el array; con una clave estable solo
  mueve lo necesario y conserva el estado de cada fila. Además, el control de flujo nuevo no necesita importar `NgFor`/`NgIf` y `track`
  es obligatorio (el compilador lo exige): el error deja de ser posible.

## 10. D-04 / Fase 8 — Pruebas de los servicios HTTP, del guard, del validador y del directorio

- **Decisión:** `EmpleadoService` y `ProyectoService` se prueban con `HttpTestingController` (mapeo, 404 → `null`, búsqueda, reintentos,
  alta y errores); el guard, en sus dos casos y con `returnUrl`; el validador de email único (duplicado y único, con `fakeAsync` y los
  400 ms); y `DirectorioEmpleados` de dos maneras: con la fachada simulada (aislamiento) y con la fachada y el estado reales.
- **Razón:** los servicios son la frontera con el mundo exterior y donde menos se ve un fallo. La cobertura pasa del 91,3 % al 100 % de
  líneas, pero lo importante es lo que dejó de estar sin red: el servicio de proyectos estaba al 25 %. Se mide por artefacto (servicios,
  guard, validadores), no solo en global, porque la media global oculta las ausencias.

## 11. `@defer (on viewport)` para el desglose del dashboard, con su coste medido

- **Decisión:** el desglose por rol se difiere con `@defer (on viewport; prefetch on idle)` (Fase 7).
- **Razón:** no es crítico para el primer pintado. **Coste medido:** el runtime de `@defer` añade unos 8,6 kB sin comprimir al bundle
  inicial y el bloque en sí pesa 1,7 kB, así que, por red, el bundle crece 0,8 kB (el sin comprimir baja 2,1 kB por haber quitado
  `NgFor`/`NgIf` y el código con `any`). Se deja porque lo pide el enunciado y prepara el terreno para bloques mayores; se documenta para
  que nadie lo tome por una mejora de tamaño.

## 12. Endurecer las puertas para que la deuda no vuelva

- **Decisión:** `ng lint` exige `OnPush` y control de flujo nuevo además de `no-explicit-any` y los imports por el barrel;
  `check:architecture` falla si falta `OnPush` o aparece un import cruzado; `audit:debt` da el recuento de las ocho deficiencias.
- **Razón:** un refactor sin puertas se deshace en el siguiente sprint. Las reglas convierten los criterios de aceptación en fallos de
  compilación o de integración continua. La misma configuración reforzada aplicada a la base da 75 errores de lint (frente a los 42 de
  su configuración original): la base no era «limpia» para su propio lint, era ciega a la mitad de la deuda.

## 13. Proyecto autónomo, con la base conservada aparte

- **Decisión:** como práctica final, `talenthub/` tiene su propio `package.json`, `package-lock.json` y `node_modules` (sin workspace), y la base
  con deuda se conserva sin instalar en `../base/` para poder repetir la auditoría.
- **Razón:** se entrega y se evalúa por separado; y guardar el «antes» permite verificar las cifras del `AUDIT.md` con los mismos scripts.
