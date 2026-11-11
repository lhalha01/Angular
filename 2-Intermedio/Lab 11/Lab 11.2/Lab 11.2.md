[[_TOC_]]

# Lab 11.2: TypeScript aplicado — tipado de la aplicación del Lab 10

> Extraído de `../Lab 11.md` (segunda mitad del documento original).

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
