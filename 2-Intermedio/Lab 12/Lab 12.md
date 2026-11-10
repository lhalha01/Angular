
[[_TOC_]]

# Lab 12: Arquitectura por features — TalentHub: estructura del proyecto

## Objetivo

Organizar el proyecto TalentHub con arquitectura `core/` / `shared/` / `features/`, barrel files y path aliases, de forma que el resto de labs puedan crecer sin acoplamiento.

## Prerequisitos

- Lab 11 completado (modelos y DTOs definidos).
- Leer el capítulo [Arquitectura por features](./Introducción.md).

---

## Fase 1 — Estructura de carpetas (15 min)

Crea la siguiente estructura en `src/app/`:

```
src/app/
├── core/
│   ├── guards/            ← authGuard (lab 13)
│   ├── interceptors/      ← auth + error interceptors (lab 14)
│   └── layout/
│       ├── navbar/
│       └── footer/
├── shared/
│   ├── components/
│   │   ├── spinner/
│   │   ├── avatar/
│   │   └── badge-disponibilidad/
│   └── validators/        ← validadores reutilizables (lab 16)
└── features/
    ├── empleados/
    │   ├── models/            ← mover desde lab 11
    │   ├── services/
    │   ├── resolvers/
    │   ├── components/
    │   └── index.ts
    ├── proyectos/
    │   ├── models/            ← mover desde lab 11
    │   ├── services/
    │   ├── components/
    │   └── index.ts
    └── dashboard/
        ├── components/
        └── index.ts
```

---

## Fase 2 — Barrel files (15 min)

```typescript
// features/empleados/index.ts
export { EmpleadoService }   from './services/empleado.service';
export { Empleado, NuevoEmpleado, EmpleadoResumen, esEmpleado } from './models/empleado.model';
export { mapearEmpleado }    from './models/empleado.mapper';

// features/proyectos/index.ts
export { ProyectoService }   from './services/proyecto.service';
export { Proyecto, ProyectoResumen, EstadoProyecto } from './models/proyecto.model';
```

---

## Fase 3 — Path aliases (10 min)

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@core/*":      ["src/app/core/*"],
      "@shared/*":    ["src/app/shared/*"],
      "@features/*":  ["src/app/features/*"]
    }
  }
}
```

Actualiza los imports rotos para usar los nuevos alias.

---

## Fase 4 — Componentes de layout (10 min)

Genera los componentes de layout mínimos:

```bash
ng g c core/layout/navbar --skip-tests
ng g c core/layout/footer --skip-tests
```

El navbar debe mostrar: logo TalentHub, enlace a Directorio, enlace a Proyectos, enlace a Dashboard.

---

## Criterios de aceptación

- La estructura de carpetas coincide con el esquema de la Fase 1.
- Barrel files en `features/empleados/`, `features/proyectos/` y `features/dashboard/`.
- Ningún componente importa directamente de la ruta interna de otra feature.
- `ng build` compila sin errores.

## Entregable

Rama `lab-12-arquitectura`. Captura de la estructura en el explorador de VS Code.

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
