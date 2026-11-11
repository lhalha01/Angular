[[_TOC_]]

# Lab 12.2: Arquitectura por features — estructura de la aplicación de tareas y usuarios

> Extraído de `../Lab 12.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 11.2](../../Lab%2011/Lab%2011.2/Lab%2011.2.md), que ya está realizado (versión adaptada).

## Prerequisitos

- Lab 11 completado (proyecto con tipos correctos).
- Leer el capítulo [Arquitectura por features](./Introducción.md).

---

## Fase 1 — Estructura de carpetas (15 min)

Crea la siguiente estructura vacía:

```
src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   └── layout/
├── shared/
│   ├── components/
│   └── pipes/
└── features/
    ├── tareas/
    │   ├── models/
    │   ├── services/
    │   ├── components/
    │   └── index.ts
    └── usuarios/
        ├── models/
        ├── services/
        ├── components/
        └── index.ts
```

---

## Fase 2 — Mover artefactos (30 min)

1. Mueve `tarea.model.ts` y `usuario.model.ts` a sus carpetas `features/*/models/`.
2. Mueve los servicios correspondientes a `features/*/services/`.
3. Mueve cada componente a su feature o a `shared/components/` si es reutilizable.
4. Actualiza todos los imports rotos (el IDE te ayudará con "Update imports").

---

## Fase 3 — Barrel files (15 min)

Crea `features/tareas/index.ts`:

```typescript
export { TareaService } from './services/tarea.service';
export { Tarea, NuevaTarea, TareaResumen } from './models/tarea.model';
```

Crea `features/usuarios/index.ts`:

```typescript
export { UsuarioService } from './services/usuario.service';
export { Usuario, NuevoUsuario } from './models/usuario.model';
```

Actualiza todos los imports para usar el barrel en lugar de rutas internas:

```typescript
// ✅ Correcto
import { TareaService, Tarea } from '@features/tareas';

// ❌ Evitar
import { TareaService } from '../../features/tareas/services/tarea.service';
```

---

## Fase 4 — Configurar path aliases (15 min)

En `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*":     ["src/app/core/*"],
      "@shared/*":   ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"]
    }
  }
}
```

---

## Criterios de aceptación

- La estructura de carpetas coincide con el esquema de la Fase 1.
- No hay imports cruzados entre features (una feature no importa de otra).
- Los barrel files están presentes y funcionan.
- `ng build` compila sin errores.
- La aplicación funciona igual que antes del refactor.

## Entregable

Rama o commit con el refactor estructural. Captura de la estructura de carpetas y de `ng build` completado.
