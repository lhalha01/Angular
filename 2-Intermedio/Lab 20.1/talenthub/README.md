# TalentHub — Lab 20.1 (refactor guiado por métricas)

TalentHub (Angular 20, standalone, Signals, `strict: true`) **refactorizado**: la base con deuda técnica de
[`../base/`](../base/README.md) (ocho deficiencias, D-01 a D-08) auditada, resuelta y medida antes y después. El enunciado está en
[`../Lab 20.1.md`](../Lab%2020.1.md). Es un proyecto **independiente**: su propio `package.json`, `package-lock.json` y `node_modules`.

| Entregable | Dónde |
| --- | --- |
| Auditoría con métricas antes/después | [`AUDIT.md`](./AUDIT.md) |
| Decisiones del refactor con su justificación | [`DECISION_LOG.md`](./DECISION_LOG.md) |
| Código refactorizado | este proyecto (`src/`); la base, en [`../base/`](../base/) |
| Capturas: `ng lint` a 0, cobertura de Karma, auditoría y bundle | [`../evidencias/`](../evidencias/) |

## Resultado

| Medida | Antes (base) | Después |
| --- | --- | --- |
| Hallazgos de deuda D-01..D-08 | 82 | **0** |
| `ng lint` (errores) | 42 | **0** |
| `check:architecture` (infracciones) | 24 | **0** |
| Pruebas / cobertura de líneas | 232 / 91,32 % | **322 / 100 %** |
| Cobertura de líneas en los servicios de proyectos | 25,00 % | **100 %** |
| Bundle inicial (`ng build`, sin comprimir) | 321,74 kB | **319,62 kB** |

## Cómo arrancar

Requisitos: **Node.js ≥ 20.19 y < 22**, npm y, para el backend, Python 3.11 o superior. TalentHub usa **siempre el backend local** del
repositorio (`/users`, que son los empleados, y `/projects`): hay que arrancarlo primero.

```bash
# 1. Backend (desde la carpeta backend/ del repositorio)
.\start.cmd               # Windows;  en Linux/macOS: ./start.sh      → http://localhost:8000

# 2. Aplicación (desde esta carpeta)
npm install               # una sola vez, en el node_modules de este proyecto
npm start                 # http://localhost:4200/
```

**Login simulado:** cualquier email y contraseña (por ejemplo, `ana@example.com` / `1234`); se guarda un token opaco en `sessionStorage`.

## Cómo ejecutar las comprobaciones

```bash
npx ng lint                                                          # ESLint: 0 errores, con las reglas reforzadas de este lab
npx tsc --noEmit --strict                                            # tipos
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage  # 322 pruebas, 100 % de líneas (no necesitan el backend)
npx ng build --stats-json                                            # compilación + metafile para analizar el bundle
npm run check:architecture                                           # barrel, capas, dependencias entre features y OnPush
npm run test:architecture                                            # 16 pruebas de esa comprobación
npm run audit:debt                                                   # recuento de D-01..D-08 (npm run audit:debt -- --json)
```

Para repetir la auditoría de la base: `cd ../base && npm install && npm run audit:debt` (y el resto de comandos de arriba).

## Qué cambió respecto a la base

Cada fase del enunciado, con su deficiencia (detalle en [`AUDIT.md`](./AUDIT.md) y [`DECISION_LOG.md`](./DECISION_LOG.md)):

1. **Auditoría** (Fase 1): lint, cobertura, bundle, arquitectura y el recuento `audit:debt`.
2. **Tipado y contratos** (Fase 2, D-01): `any` → DTO, `*.mapper.ts` y type guards; `tsc --strict` sin errores.
3. **Arquitectura** (Fase 3, D-07): imports por el barrel y grafo de features comprobado.
4. **Guard funcional** (Fase 4, D-03): clase `AuthGuard` → `authGuard` (`CanMatchFn`).
5. **Fugas de memoria** (Fase 5, D-08): `toSignal()` / `takeUntilDestroyed()`; sin `ngOnDestroy`.
6. **Validadores al shared** (Fase 6, D-05): `shared/validators/`, con pruebas.
7. **Performance** (Fase 7, D-02, D-06): `OnPush` en todos, `@for … track`, `@defer (on viewport)` en el dashboard.
8. **Tests** (Fase 8, D-04): servicios HTTP, guard, validador de email único y directorio.

## Desviaciones respecto al enunciado

1. **La base no la «proporciona el formador»:** se construyó reintroduciendo las ocho deficiencias en una copia del TalentHub de la práctica
   final (véase [`AUDIT.md`](./AUDIT.md)). Por eso el proyecto refactorizado **coincide con el del [Lab 20](../../Lab%2020/talenthub/README.md)** salvo las
   reglas de ESLint reforzadas y el script `audit:debt`.
2. **`canMatch` en lugar de `CanActivateFn`:** el enunciado escribe el guard funcional con `canActivate` y `state.url`; aquí es un `CanMatchFn`
   porque la auditoría mostró que `canActivate` deja abiertas las rutas hijas tras cerrar la sesión (hallazgo en `AUDIT.md`).
3. **`webpack-bundle-analyzer` no se puede usar** con este builder (esbuild): el análisis se hizo con el metafile de `ng build --stats-json`.
4. **El bundle crece 0,8 kB por red** (aunque baja 2,1 kB sin comprimir) por el runtime de `@defer`; está medido y explicado.
5. **Las capturas no son de la ventana del terminal:** son la salida real de `ng lint` y de `ng test --code-coverage` y tablas generadas a partir de
   las mediciones reales (`ng build`, `tsc`, ESLint, `audit:debt`) de cada proyecto.
6. **Datos:** la aplicación usa el backend local (`/users` y `/projects`) en lugar de JSONPlaceholder (decisión del curso para el nivel Intermedio).

## Versiones

Angular **20.3.35** (CLI 20.3.42), TypeScript 5.9, RxJS 7.8 y Zone.js 0.15: la última versión de la rama 20 (Node < 22, como fija el curso).

## Entrega

El enunciado pide la rama `lab-20.1-refactor`. En este repositorio el trabajo se sube a `main`.
