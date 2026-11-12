# TalentHub — base con deuda técnica (punto de partida del Lab 20.1)

Esta es la **base de partida** del [Lab 20.1](../Lab%2020.1.md): un TalentHub que funciona, con las ocho deficiencias conocidas del
enunciado. **No se arregla aquí**: se conserva tal cual para poder repetir la auditoría; el refactor está en
[`../talenthub/`](../talenthub/README.md) y sus cifras, en [`../talenthub/AUDIT.md`](../talenthub/AUDIT.md).

El enunciado habla de una base «proporcionada por el formador» que no existe en el repositorio, así que se **construyó** reintroduciendo
las deficiencias en una copia del TalentHub de la práctica final ([Lab 20](../../Lab%2020/talenthub/README.md)). Funciona igual contra el
backend local y su suite (232 pruebas) pasa entera.

## Dónde está cada deficiencia

| # | Deficiencia | Dónde se ve |
| --- | --- | --- |
| D-01 | `any` en los servicios | `EmpleadoService` y `ProyectoService` (33 usos): la respuesta de la API se mapea dentro, sin DTO ni `mappers/` |
| D-02 | `ChangeDetection.Default` | los 17 componentes |
| D-03 | Guard como clase legacy | `core/guards/auth.guard.ts` (`AuthGuard implements CanActivate`); las rutas usan `canActivate` |
| D-04 | Cero tests en los servicios HTTP | no hay `empleado.service.spec.ts` ni `proyecto.service.spec.ts` |
| D-05 | Validaciones inline | el email único, el patrón del nombre y el validador cruzado están dentro de `formulario-alta.component.ts` |
| D-06 | `*ngFor` sin `trackBy` | 11 `*ngFor` (y 5 `*ngIf`) en los componentes |
| D-07 | Imports a archivos internos de otras features | `dashboard`, `perfil`, `formulario-alta` y `desglose-por-rol` (7 imports) |
| D-08 | Suscripciones manuales sin cancelar | `directorio`, `perfil`, `detalle-proyecto`, `formulario-alta` (sin cancelar) y `dashboard`, `lista-proyectos` (con `ngOnDestroy`) |

Además, el desglose por rol del dashboard no está diferido (sin `@defer`) y `ng lint` no tiene las reglas de `OnPush` ni de control de flujo.

## Cómo repetir la auditoría

```bash
cd "2-Intermedio/Lab 20.1/base"
npm install                                   # esta carpeta no incluye node_modules
npm run audit:debt                            # recuento de D-01..D-08 → 82 hallazgos
npx ng lint                                   # 42 errores
npx tsc --noEmit --strict                     # 0 errores
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage   # 232 pruebas, 91,32 % de líneas
npx ng build --stats-json                     # 321,74 kB iniciales
npm run check:architecture                    # 24 infracciones
```

El backend local (`backend/`) debe estar arrancado para ejecutar la aplicación (`npm start`); las pruebas no lo necesitan.
