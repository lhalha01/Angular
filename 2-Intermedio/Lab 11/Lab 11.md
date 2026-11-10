[[_TOC_]]

# Lab 11: TypeScript aplicado — TalentHub: contratos de dominio

## Objetivo

Definir los modelos de dominio y DTOs del proyecto **TalentHub** (ver [Lab 20](../Lab-20-Final-Lab.md) para el briefing completo), sin `any`, con Utility Types y funciones de mapeo que asienten la base de todos los labs siguientes.

## Prerequisitos

- Proyecto Angular 20 creado con `ng new talenthub --standalone`.
- `strict: true` activado en `tsconfig.json`.
- Leer el capítulo [TypeScript aplicado](./Introducción.md).

---

## Fase 1 — Modelos de dominio (20 min)

Crea la carpeta `src/app/features/empleados/models/` y escribe:

```typescript
// empleado.model.ts
export type RolEmpleado = 'desarrollador' | 'diseñador' | 'qa' | 'devops' | 'manager';

export interface Habilidad {
  nombre: string;
  nivel: 'junior' | 'mid' | 'senior';
}

export interface Empleado {
  id: number;
  nombre: string;
  email: string;
  rol: RolEmpleado;
  habilidades: Habilidad[];
  disponible: boolean;
  proyectoActualId: number | null;
  fechaIncorporacion: Date;
}

export type NuevoEmpleado     = Omit<Empleado, 'id' | 'fechaIncorporacion'>;
export type ActualizarEmpleado = Partial<Pick<Empleado, 'rol' | 'disponible' | 'proyectoActualId' | 'habilidades'>>;
export type EmpleadoResumen   = Pick<Empleado, 'id' | 'nombre' | 'email' | 'rol' | 'disponible'>;
```

Crea `src/app/features/proyectos/models/` y escribe:

```typescript
// proyecto.model.ts
export type EstadoProyecto = 'activo' | 'pausado' | 'completado';

export interface Proyecto {
  id: number;
  nombre: string;
  cliente: string;
  estado: EstadoProyecto;
  fechaInicio: Date;
  fechaFin: Date | null;
  empleadosIds: number[];
}

export type ProyectoResumen = Pick<Proyecto, 'id' | 'nombre' | 'cliente' | 'estado'>;
```

---

## Fase 2 — DTOs de JSONPlaceholder (20 min)

La API real aún no está disponible. Usaremos JSONPlaceholder. Crea los DTOs y los mappers:

```typescript
// empleado.dto.ts  (corresponde a /users de JSONPlaceholder)
export interface EmpleadoDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: { name: string };
}

// empleado.mapper.ts
export function mapearEmpleado(dto: EmpleadoDto): Empleado {
  return {
    id:                 dto.id,
    nombre:             dto.name,
    email:              dto.email,
    rol:                'desarrollador' as RolEmpleado,  // valor por defecto hasta tener la API real
    habilidades:        [],
    disponible:         dto.id % 2 === 0,  // simulado
    proyectoActualId:   null,
    fechaIncorporacion: new Date()
  };
}
```

---

## Fase 3 — Type Guards (10 min)

```typescript
// empleado.model.ts
export function esEmpleado(valor: unknown): valor is Empleado {
  return (
    typeof valor === 'object' && valor !== null &&
    'nombre' in valor && 'email' in valor && 'rol' in valor
  );
}
```

---

## Criterios de aceptación

- `npx tsc --noEmit --strict` sin errores.
- `ng lint` a 0 errores `no-explicit-any`.
- Los modelos de `Empleado` y `Proyecto` están en sus features respectivas.
- Las funciones de mapeo están en archivos `*.mapper.ts` separados.
- Los DTOs no se exportan fuera de los mappers.

## Entregable

Rama `lab-11-typescript`. Captura de `npx tsc --noEmit` sin errores.

## Prerequisitos

- Proyecto finalizado del Lab 10 (Gestor de Tareas / Gestor de Usuarios) en funcionamiento.
- Leer el capítulo [TypeScript aplicado](./Introducción.md) antes de empezar.

---

## Fase 1 — Auditoría de tipos (15 min)

1. Ejecuta el linter con `ng lint` y anota todos los errores `@typescript-eslint/no-explicit-any`.
2. Ejecuta `npx tsc --noEmit --strict` y revisa los errores de tipo.
3. Documenta en un comentario al inicio de cada archivo los tipos que vas a introducir.

---

## Fase 2 — Interfaces de dominio (30 min)

Crea la carpeta `src/app/models/` y añade:

**`tarea.model.ts`**

```typescript
export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  prioridad: 'alta' | 'media' | 'baja';
  fechaCreacion: Date;
  usuarioId: number;
}

export type NuevaTarea = Omit<Tarea, 'id' | 'fechaCreacion'>;
export type ActualizarTarea = Partial<Pick<Tarea, 'titulo' | 'descripcion' | 'completada' | 'prioridad'>>;
export type TareaResumen = Pick<Tarea, 'id' | 'titulo' | 'completada' | 'prioridad'>;
```

**`usuario.model.ts`**

```typescript
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}

export type NuevoUsuario = Omit<Usuario, 'id'>;
```

---

## Fase 3 — Actualizar servicios (20 min)

1. Abre `tarea.service.ts` y reemplaza todos los `any` por los tipos creados.
2. Tipa el retorno de cada método: `getTareas(): Tarea[]`, `crear(t: NuevaTarea): Tarea`, etc.
3. Añade el tipo a las llamadas HTTP: `this.http.get<Tarea[]>('/api/tareas')`.

---

## Fase 4 — Actualizar componentes (20 min)

1. Tipa todos los `@Input()` y `@Output()` con las interfaces creadas.
2. Elimina las propiedades declaradas como `any`; sustitúyelas por el tipo correcto.
3. Añade un Type Guard en el componente que recibe datos de una fuente externa:

```typescript
function esTarea(valor: unknown): valor is Tarea {
  return typeof valor === 'object' && valor !== null && 'titulo' in valor && 'completada' in valor;
}
```

---

## Criterios de aceptación

- `ng lint` devuelve 0 errores de `no-explicit-any`.
- `npx tsc --noEmit --strict` compila sin errores.
- Los modelos están en `src/app/models/` y se importan desde los servicios y componentes.
- No se ha usado `as any` como atajo para pasar compilación.

## Entregable

Rama o commit con el refactor de tipos. Captura de pantalla de `ng lint` sin errores y de la aplicación funcionando sin cambios visibles.
