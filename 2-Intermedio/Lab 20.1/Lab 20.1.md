
[[_TOC_]]

# Lab 20.1: Prueba técnica — TalentHub Refactor (Nexus Digital Solutions)

---

## 📋 Briefing del proyecto

**Contexto:** Mismo proyecto TalentHub del Lab 20. El equipo anterior entregó una primera versión funcional, pero con deuda técnica identificada en la revisión de código. Tu tarea es **tomar esa base y llevarla a producción** aplicando los estándares del módulo.

> «El prototipo funciona, pero no lo podemos llevar a producción tal como está. Necesitamos que alguien con criterio técnico lo audite, documente los problemas y los resuelva antes del go-live del lunes.»

**Base de partida:** Proyecto TalentHub con las siguientes deficiencias conocidas:

| #    | Deficiencia                                             | Impacto                                |
| ---- | ------------------------------------------------------- | -------------------------------------- |
| D-01 | `any` en `EmpleadoService` y `ProyectoService`    | Bugs silenciosos, no tipado            |
| D-02 | `ChangeDetection.Default` en todos los componentes    | Renders innecesarios en listas grandes |
| D-03 | Guard implementado como clase legacy                    | No sigue el estándar Angular 15+      |
| D-04 | Cero tests en los servicios HTTP                        | Sin red de seguridad                   |
| D-05 | Validaciones inline en el componente del formulario     | No reutilizables, no testeables        |
| D-06 | No existe `@for track`; se usa `*ngFor` sin trackBy | Degradación de rendimiento en listas  |
| D-07 | Imports directos a archivos internos de otras features  | Acoplamiento frágil                   |
| D-08 | Suscripciones manuales sin cancelar en componentes      | Fugas de memoria                       |

---

## 📋 Fases del refactor

### Fase 1 — Auditoría (20 min)

Ejecuta las herramientas de diagnóstico y documenta los resultados en `AUDIT.md`:

```bash
ng lint
ng test --code-coverage --watch=false
ng build --stats-json
npx webpack-bundle-analyzer dist/talenthub/stats.json
```

Para cada herramienta, anota:

- **Número de problemas encontrados.**
- **Las 3 issues más graves.**
- **Métrica base** (cobertura %, tamaño bundle, errores de lint).

---

### Fase 2 — Tipado y contratos (25 min)

1. Define las interfaces `Empleado`, `Proyecto`, `Habilidad`, `EmpleadoDto` según el briefing del Lab 20.
2. Sustituye todos los `any` por los tipos correctos.
3. Añade funciones de mapeo DTO→dominio aisladas en `*.mapper.ts`.
4. Verifica: `npx tsc --noEmit --strict` sin errores.

---

### Fase 3 — Arquitectura (20 min)

1. Comprueba que la estructura sigue `core/` `shared/` `features/`.
2. Añade barrel files donde falten.
3. Corrige los imports cruzados entre features (D-07).

---

### Fase 4 — Migrar guard a función (15 min)

```typescript
// ❌ Guard legacy (clase)
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean { ... }
}

// ✅ Guard funcional moderno
export const authGuard: CanActivateFn = (_, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

---

### Fase 5 — Fugas de memoria (15 min)

1. Identifica todos los `subscribe()` manuales en componentes.
2. Sustituye por `toSignal()` donde sea posible.
3. Donde no sea posible, añade `takeUntilDestroyed()`.
4. Elimina todos los `ngOnDestroy` que ya no sean necesarios.

---

### Fase 6 — Validadores al shared (15 min)

1. Mueve las validaciones inline a `shared/validators/`.
2. Crea tests unitarios para cada validador.
3. Verifica que el formulario sigue funcionando igual.

---

### Fase 7 — Performance (15 min)

1. Añade `ChangeDetectionStrategy.OnPush` a todos los componentes.
2. Convierte todos los `*ngFor` a `@for ... track item.id`.
3. Aplica `@defer (on viewport)` al bloque de estadísticas del dashboard.
4. Comprueba que la cobertura de tests no bajó.

---

### Fase 8 — Tests (25 min)

Cubre al menos:

- `EmpleadoService`: `getAll()` con mapeo, `getById()` con 404.
- `authGuard`: autenticado / no autenticado.
- Validador de email único: duplicado / único.
- Componente `DirectorioEmpleados`: render básico y llamada a `cargar()`.

---

## 📊 Entregables

| Entregable                 | Descripción                                                           |
| -------------------------- | ---------------------------------------------------------------------- |
| `AUDIT.md`               | Métricas antes/después para cada categoría                          |
| Rama `lab-20.1-refactor` | Código refactorizado                                                  |
| Capturas finales           | `ng lint` a 0 errores, resumen de cobertura de Karma                 |
| `DECISION_LOG.md`        | Una entrada por cada decisión de refactor con justificación técnica |

---

## 📊 Criterios de evaluación

| Criterio                                            | Peso |
| --------------------------------------------------- | ---- |
| Todas las deficiencias D-01 a D-08 resueltas        | 40%  |
| Auditoría documentada con métricas antes/después | 20%  |
| Tests cubriendo los artefactos requeridos           | 25%  |
| Decision log con justificaciones técnicas claras   | 15%  |

## Objetivo

Variante de cierre orientada a la mejora de una aplicación ya existente: refactorización guiada por métricas de calidad, cobertura de tests y documentación de deuda técnica.

## Prerequisitos

- Mismos que el Lab 20. Puedes partir del Lab 19 completo o de una base proporcionada por el formador.

---

## Descripción del escenario

Se te proporciona una aplicación Angular funcional pero con deuda técnica identificada:

- Uso de `any` en varios servicios.
- Componentes sin `OnPush`.
- Sin tests en los servicios HTTP.
- Un guard implementado como clase (legado).
- Formularios con validaciones inline en el componente.

Tu tarea: refactorizar siguiendo el estilo del módulo y documentar cada mejora.

---

## Fase 1 — Auditoría de deuda (20 min)

Ejecuta:

```bash
ng lint
ng test --code-coverage --watch=false
ng build --stats-json
```

Documenta en `AUDIT.md`:

- Número de errores de lint.
- Porcentaje de cobertura actual.
- Tamaño del bundle main.js.

---

## Fase 2 — Refactor de tipos y arquitectura (30 min)

1. Elimina todos los `any` aplicando Utility Types o Type Guards.
2. Reorganiza en features si la estructura es plana.
3. Añade barrel files si faltan.

---

## Fase 3 — Migrar guard a función (15 min)

```typescript
// ❌ Guard de clase (legado)
@Injectable()
export class AuthGuard implements CanActivate { /* ... */ }

// ✅ Guard funcional (actual)
export const authGuard: CanActivateFn = () => { /* ... */ };
```

---

## Fase 4 — Añadir tests críticos (30 min)

Cubre al menos:

- Los dos métodos más usados del servicio HTTP principal.
- El guard migrado.
- Un validador personalizado.

---

## Fase 5 — Performance (15 min)

- `OnPush` en todos los componentes modificados.
- `track` en todos los bucles.
- Comprueba que el bundle no creció respecto a la auditoría inicial.

---

## Entregables

1. `AUDIT.md` con la auditoría inicial y las métricas finales.
2. Rama `lab-20.1-refactor` con los cambios.
3. Captura de `ng lint` y `ng test --code-coverage` finales.
4. Comparativa de tamaño de bundle (antes/después).
