
[[_TOC_]]

# Lab 12.1: Arquitectura por features — TalentHub: estructura del proyecto

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
