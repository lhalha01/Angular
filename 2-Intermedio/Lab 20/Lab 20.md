
[[_TOC_]]

# Lab 20: Prueba técnica — TalentHub (Nexus Digital Solutions)

---

## 📋 Briefing del proyecto

> «Necesitamos una herramienta interna para gestionar nuestro talento. Hoy usamos hojas de cálculo para saber quién está disponible y en qué proyecto trabaja cada persona. Queremos un portal web donde cualquier manager pueda ver el directorio de empleados, filtrar por habilidades y disponibilidad, y dar de alta a nuevos empleados. Además, queremos poder ver los proyectos activos y saber qué equipo tiene asignado cada uno.»

**Tiempo estimado de entrega:** Sprint de 2 semanas (este lab simula la primera entrega funcional).

**API disponible:** `https://jsonplaceholder.typicode.com` (backend temporal hasta que el equipo de backend entregue la API real).

---

## 🏗 Entidades de dominio

```typescript
// features/empleados/models/empleado.model.ts
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

export type NuevoEmpleado = Omit<Empleado, 'id' | 'fechaIncorporacion'>;
export type EmpleadoResumen = Pick<Empleado, 'id' | 'nombre' | 'email' | 'rol' | 'disponible'>;

// features/proyectos/models/proyecto.model.ts
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
```

---

## 📦 Arquitectura esperada

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   └── error.interceptor.ts
│   └── layout/
│       ├── navbar/
│       └── footer/
├── shared/
│   ├── components/
│   │   ├── spinner/
│   │   ├── avatar/
│   │   └── badge-disponibilidad/
│   └── validators/
│       ├── email-unico.validator.ts
│       └── no-espacios.validator.ts
└── features/
    ├── empleados/
    │   ├── models/
    │   ├── services/
    │   │   ├── empleado.service.ts
    │   │   ├── empleado-state.service.ts
    │   │   └── empleados.facade.ts
    │   ├── resolvers/
    │   │   └── empleado.resolver.ts
    │   ├── components/
    │   │   ├── directorio/
    │   │   ├── perfil-empleado/
    │   │   └── formulario-alta/
    │   └── index.ts
    ├── proyectos/
    │   ├── models/
    │   ├── services/
    │   │   └── proyecto.service.ts
    │   ├── components/
    │   │   ├── lista-proyectos/
    │   │   └── detalle-proyecto/
    │   └── index.ts
    └── dashboard/
        ├── components/
        │   └── dashboard/
        └── index.ts
```

---

## ✅ Requisitos funcionales del MVP

### RF-01: Directorio de empleados

- Mostrar la lista de empleados con nombre, email, rol y badge de disponibilidad.
- Buscador en tiempo real por nombre (debounce 300 ms, mínimo 2 caracteres).
- Filtros por disponibilidad (todos / disponibles / ocupados) y por rol.
- Los filtros combinan entre sí y con la búsqueda de forma reactiva.

### RF-02: Detalle de empleado

- Ruta `/empleados/:id` carga el empleado mediante **resolver** (no pantalla vacía).
- Muestra habilidades con nivel (badge coloreado por nivel).
- Si el empleado tiene proyecto asignado, muestra el nombre del proyecto.

### RF-03: Alta de empleado

- Formulario reactivo con los campos: nombre, email, rol, disponible, habilidades (FormArray).
- Validaciones: nombre obligatorio y solo letras/espacios; email obligatorio, formato válido y **asíncrono: email no duplicado** (simulado con delay).
- Cross-field: si `disponible = false`, el campo `proyectoActualId` es obligatorio.
- Confirmación al salir si hay cambios sin guardar (`CanDeactivate`).

### RF-04: Lista de proyectos

- Ruta `/proyectos` muestra proyectos con nombre, cliente, estado y número de empleados.
- Filtra por estado (activo / pausado / completado).

### RF-05: Dashboard

- Ruta `/` (home protegida por auth guard).
- Muestra: total empleados, disponibles, proyectos activos.
- El bloque de estadísticas detalladas se carga con `@defer (on viewport)`.

### RF-06: Autenticación simulada

- Si no hay token en `sessionStorage`, redirige a `/login`.
- Login simulado: cualquier email + contraseña guarda un token y redirige al dashboard.

---

## ✅ Requisitos no funcionales

| RNF    | Descripción                                                        |
| ------ | ------------------------------------------------------------------- |
| RNF-01 | `ChangeDetectionStrategy.OnPush` en todos los componentes         |
| RNF-02 | `track empleado.id` / `track proyecto.id` en todos los `@for` |
| RNF-03 | `ng lint` a 0 errores                                             |
| RNF-04 | `ng build` sin warnings de bundle > 500 KB                        |
| RNF-05 | Cobertura de tests > 70% en servicios de la feature `empleados`   |
| RNF-06 | Sin `any` en el código fuente                                    |
| RNF-07 | Barrel files en todas las features; imports a través del barrel    |

---

## ✅ Requisitos de patrones de diseño (Cap. 10)

Documenta en `DECISION_LOG.md` cómo has aplicado **al menos 3** de los siguientes patrones:

| Patrón              | Dónde aplicarlo                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Facade**     | `EmpleadosFacade` como única interfaz para los componentes                              |
| **Repository** | `EmpleadoService` abstrae el origen de datos (JSONPlaceholder hoy, API real mañana)     |
| **Strategy**   | Filtros como estrategias intercambiables (`filtrarPorRol`, `filtrarPorDisponibilidad`) |
| **Adapter**    | Función `mapearEmpleado(dto)` que adapta el DTO de JSONPlaceholder al dominio           |
| **Decorator**  | Interceptores HTTP como decoradores de petición                                           |

---

## 🧪 Cobertura de tests requerida

| Artefacto               | Tipo                           | Mínimo                           |
| ----------------------- | ------------------------------ | --------------------------------- |
| `EmpleadoService`     | Unit (HttpClientTestingModule) | GET, mapeo DTO, 404               |
| `authGuard`           | Unit                           | autenticado y no autenticado      |
| `emailUnicoValidator` | Unit                           | duplicado y único                |
| `DirectorioEmpleados` | Integration (TestBed)          | muestra lista, spinner, búsqueda |

---

## 📊 Criterios de evaluación

| Criterio                                                       | Nivel  | Peso |
| -------------------------------------------------------------- | ------ | ---- |
| Arquitectura por features correcta y sin imports cruzados      | N2     | 20%  |
| Todos los RF implementados y funcionales                       | N2     | 25%  |
| Capa HTTP con interceptores, mapeo y manejo de errores         | N2–N3 | 15%  |
| Formulario de alta con validaciones, FormArray y CanDeactivate | N2     | 15%  |
| Tests pasando con cobertura esperada                           | N2     | 15%  |
| Patrones documentados en DECISION_LOG.md con justificación    | N3     | 10%  |

---

## 📤 Entregable

- Rama `lab-20-talenthub` con la aplicación completa.
- `README.md` con: pasos para arrancar, credenciales de login simulado y cómo ejecutar los tests.
- `DECISION_LOG.md` con decisiones técnicas (mínimo los 3 patrones + 2 decisiones de arquitectura adicionales).
- Capturas: directorio con filtros activos, formulario con errores de validación, resumen de cobertura de Karma.

## Prerequisitos

- Labs 11–19 completados o haber revisado el [Repaso](./Repaso.md) y el checklist.
- `ng build`, `ng test` y `ng lint` pasando sin errores.

---

## Entregables obligatorios

### 1. Aplicación funcionando

La aplicación debe cubrir el flujo completo:

- Listado de tareas con búsqueda y filtros.
- Creación y edición con formulario reactivo y validaciones.
- Detalle de tarea cargado por resolver.
- Navegación protegida con guard de autenticación simulado.

### 2. Arquitectura por features verificada

- Estructura de carpetas: `core/`, `shared/`, `features/tareas/`.
- Barrel files presentes y usados.
- Sin imports cruzados entre features.

### 3. Tests pasando

Ejecuta `ng test --code-coverage --watch=false` y comparte la captura. Se espera:

- > 70% cobertura en `features/tareas/services/`.
  >
- Guard con 100% cobertura.
- Validadores con casos positivos y negativos.

### 4. Calidad de código

- `ng lint` a 0 errores.
- `OnPush` en todos los componentes.
- `track` en todos los `@for`.

### 5. Decision log (mínimo 5 decisiones)

Añade un archivo `DECISION_LOG.md` en la raíz del proyecto con al menos 5 decisiones técnicas tomadas y su justificación. Ejemplo:

```markdown
## Decisiones técnicas

1. Uso de Signals en lugar de BehaviorSubject para el estado
   - Razón: menos boilerplate, compatibilidad nativa con OnPush.
2. TareasFacade como única interfaz para los componentes
   - Razón: los componentes no dependen del origen de los datos.
```

---

## Criterios de evaluación (N3)

| Criterio                                   | Peso |
| ------------------------------------------ | ---- |
| Arquitectura por features correcta         | 30%  |
| Tests pasando con cobertura esperada       | 25%  |
| Capa HTTP con interceptores y mapeo        | 20%  |
| Formularios con validaciones complejas     | 15%  |
| Decision log con justificaciones técnicas | 10%  |

## Entregable

Repositorio en rama `lab-20-final` con `README.md` actualizado indicando cómo arrancar y testear la aplicación.
