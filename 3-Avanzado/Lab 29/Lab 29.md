
# 📝 Laboratorio: Implementación de CRUD de Tareas en Angular

## 🎯 Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. **Crear un modelo de datos completo** con interfaces TypeScript y enumeraciones
2. **Implementar un servicio con Signals** para gestión de estado reactivo
3. **Desarrollar componentes CRUD** (Create, Read, Update, Delete) completos
4. **Aplicar Reactive Forms** con validaciones personalizadas
5. **Implementar lazy loading** para optimización de rutas
6. **Integrar componentes anidados** y comunicación entre componentes
7. **Utilizar Signals y Computed** para estado derivado
8. **Aplicar patrones de arquitectura** escalables en Angular 21

---

## 📋 Pre-requisitos

### Conocimientos Requeridos

- TypeScript básico-intermedio
- Angular fundamentals (componentes, servicios, routing)
- Reactive Forms básico
- RxJS observables (básico)
- HTML/CSS

### Aplicación Base

Debes partir de la aplicación **"Gestión de Usuarios"** existente que incluye:

- ✅ Módulo de usuarios completo (lista, formulario, detalle)
- ✅ Servicios base (UsuarioService, NotificacionService, LoggerService)
- ✅ Sistema de routing configurado
- ✅ Componentes compartidos (Paginación)
- ✅ Pipes y directivas personalizadas

---

## 📖 Contexto del Laboratorio

Tu empresa necesita expandir la aplicación de gestión de usuarios agregando un **sistema de gestión de tareas** que permita:

- Crear y asignar tareas a usuarios
- Categorizar tareas por estado y prioridad
- Filtrar y buscar tareas
- Establecer fechas de vencimiento
- Ver estadísticas de tareas por usuario

Este laboratorio te guiará en la implementación completa de este módulo siguiendo las mejores prácticas de Angular.

---

## 🏗️ Arquitectura a Implementar

```
src/app/
├── features/
│   └── tareas/
│       ├── lista/
│       │   ├── lista-tareas.component.ts/html/scss
│       │   └── tarea-card/
│       │       └── tarea-card.component.ts/html/scss
│       ├── formulario/
│       │   └── formulario-tarea.component.ts/html/scss
│       ├── detalle/
│       │   └── detalle-tarea.component.ts/html/scss
│       └── tareas.routes.ts
├── models/
│   └── tarea.model.ts
├── services/
│   ├── tarea.service.ts
│   ├── tarea-utilities.service.ts
│   └── tarea-validation.service.ts
└── constants/
    └── app.constants.ts (actualizar)
```

---

## ✅ Fase 1: Modelo de Datos (20 minutos)

### Objetivo

Crear las interfaces y enumeraciones necesarias para representar tareas.

### Tareas

**1.1 Crear `tarea.model.ts`**

Implementa las siguientes interfaces y enums:

```typescript
// Enumeraciones
export enum EstadoTarea {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en-progreso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada'
}

export enum PrioridadTarea {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente'
}

// Interfaces principales
export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fechaCreacion: Date;
  fechaVencimiento?: Date;
  fechaCompletada?: Date;
  usuarioAsignadoId?: number;
  etiquetas?: string[];
}

export interface NuevaTarea {
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fechaVencimiento?: Date;
  usuarioAsignadoId?: number;
  etiquetas?: string[];
}
```

**1.2 Actualizar `app.constants.ts`**

Agrega las constantes para estados y prioridades:

```typescript
export const ESTADOS_TAREA: Record<EstadoTarea, ConfigEstado> = {
  [EstadoTarea.PENDIENTE]: {
    label: 'Pendiente',
    color: '#6c757d',
    cssClass: 'estado-pendiente',
    icon: '⏳'
  },
  // ... completar para todos los estados
};

export const PRIORIDADES_TAREA: Record<PrioridadTarea, ConfigPrioridad> = {
  [PrioridadTarea.BAJA]: {
    label: 'Baja',
    color: '#28a745',
    cssClass: 'prioridad-baja',
    icon: '🟢'
  },
  // ... completar para todas las prioridades
};
```

### Criterios de Aceptación

- ✅ Enums con valores lowercase (kebab-case)
- ✅ Interfaces exportadas correctamente
- ✅ Propiedades opcionales marcadas con `?`
- ✅ Constantes con información visual (iconos, colores, CSS)

---

## ✅ Fase 2: Servicio de Tareas con Signals (30 minutos)

### Objetivo

Crear un servicio reactivo usando Angular Signals para gestión de estado.

### Tareas

**2.1 Crear `tarea.service.ts`**

Implementa un servicio con:

- Signal privado para almacenar tareas: `tareas = signal<Tarea[]>([])`
- Computed signal para tareas procesadas
- Métodos CRUD completos
- Gestión de datos en memoria (simular backend)

```typescript
@Injectable({ providedIn: 'root' })
export class TareaService {
  private tareasMemoria: Tarea[] = [];
  public tareas = signal<Tarea[]>([]);
  
  public readonly tareasProcesadas = computed(() => 
    this.procesarTareas(this.tareas())
  );

  // Implementar métodos:
  // - obtenerTareas(): Observable<Tarea[]>
  // - obtenerTarea(id: number): Observable<Tarea | undefined>
  // - agregarTarea(nuevaTarea: NuevaTarea): Observable<Tarea>
  // - actualizarTarea(id: number, cambios: Partial<NuevaTarea>): Observable<Tarea>
  // - eliminarTarea(id: number): Observable<void>
  // - obtenerTareasPorUsuario(usuarioId: number): Observable<Tarea[]>
}
```

**2.2 Crear tareas de ejemplo**

Implementa un método privado `cargarTareasIniciales()` que cree 3-5 tareas de ejemplo.

### Criterios de Aceptación

- ✅ Uso correcto de Signals y Computed
- ✅ IDs auto-incrementales
- ✅ Métodos retornan Observables
- ✅ Actualización correcta del signal al modificar datos
- ✅ Logging de operaciones

---

## ✅ Fase 3: Lista de Tareas con Filtros (45 minutos)

### Objetivo

Crear componente de lista con filtros, búsqueda y paginación.

### Tareas

**3.1 Crear `lista-tareas.component.ts`**

Implementa:

- Formulario reactivo para filtros (búsqueda, estado, prioridad, usuario)
- Carga de tareas desde el servicio
- Filtrado y ordenamiento
- Integración con componente de paginación
- Modal de confirmación para eliminar

**3.2 Crear `tarea-card.component.ts`**

Componente presentacional que muestre:

- Título y descripción
- Badges de estado y prioridad
- Información de usuario asignado
- Fechas (creación, vencimiento)
- Botones de acción (Ver, Editar, Eliminar)

**3.3 Configurar debounce en búsqueda**

Usa RxJS operators:

```typescript
this.filtroForm.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  takeUntilDestroyed(this.destroyRef)
).subscribe(() => this.filtrarTareas());
```

### Criterios de Aceptación

- ✅ Vista de lista responsiva
- ✅ Filtros funcionando correctamente
- ✅ Paginación integrada
- ✅ Búsqueda con debounce (300ms)
- ✅ Indicadores visuales de estado/prioridad
- ✅ Loading state durante carga

---

## ✅ Fase 4: Formulario de Tareas (45 minutos)

### Objetivo

Crear formulario reactivo con validaciones para crear/editar tareas.

### Tareas

**4.1 Crear `formulario-tarea.component.ts`**

Implementa:

- FormGroup con todos los campos de la tarea
- Validaciones síncronas y asíncronas
- Detección de modo (crear vs editar) por ruta
- Pre-población de datos en modo edición
- Preview en tiempo real

**4.2 Validaciones Requeridas**

```typescript
titulo: [
  '', 
  [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
],
fechaVencimiento: [''],
usuarioAsignadoId: [null]
```

**4.3 Validadores Personalizados**

Crea validadores a nivel de formulario:

- `validadorFechaVencimiento`: fecha futura
- `validadorEstadoCompletado`: fecha completada requerida si estado es COMPLETADA

**4.4 Carga de Usuarios**

Integra con `UsuarioService` para poblar el select de asignación usando signals.

### Criterios de Aceptación

- ✅ Formulario reactivo completo
- ✅ Validaciones funcionando
- ✅ Mensajes de error descriptivos
- ✅ Modo crear/editar detectado automáticamente
- ✅ Select de usuarios poblado dinámicamente
- ✅ Preview de badges en tiempo real
- ✅ Navegación después de guardar

---

## ✅ Fase 5: Detalle de Tarea (30 minutos)

### Objetivo

Crear componente de vista detallada de solo lectura.

### Tareas

**5.1 Crear `detalle-tarea.component.ts`**

Implementa:

- Carga de tarea por ID desde la ruta
- Signals para tarea y usuario asignado
- Computed signals para información derivada (esUrgente, estaVencida)
- Botones de acción (Editar, Eliminar, Volver)

**5.2 Tarjeta de Usuario Asignado**

Si existe usuario asignado, mostrar:

- Avatar
- Nombre completo
- Email
- Botón "Ver perfil" que navegue a `/usuarios/detalle/:id`

### Criterios de Aceptación

- ✅ Vista de solo lectura
- ✅ Información completa de la tarea
- ✅ Indicadores visuales (vencida, urgente)
- ✅ Tarjeta de usuario integrada
- ✅ Manejo de tarea no encontrada
- ✅ Navegación fluida

---

## ✅ Fase 6: Routing con Lazy Loading (20 minutos)

### Objetivo

Configurar rutas con carga diferida para optimización.

### Tareas

**6.1 Crear `tareas.routes.ts`**

```typescript
export const TAREAS_ROUTES: Routes = [
  { path: '', component: ListaTareas },
  { path: 'nuevo', component: FormularioTarea },
  { path: 'formulario/:id', component: FormularioTarea },
  { path: 'detalle/:id', component: DetalleTareaComponent },
  { path: '**', redirectTo: '' }
];
```

**6.2 Actualizar `app.routes.ts`**

```typescript
{
  path: 'tareas',
  loadChildren: () => import('./features/tareas/tareas.routes').then(m => m.TAREAS_ROUTES)
}
```

**6.3 Actualizar navegación**

Agrega enlace "Tareas" en el navbar.

### Criterios de Aceptación

- ✅ Lazy loading configurado
- ✅ Rutas funcionando correctamente
- ✅ Parámetros de ruta detectados
- ✅ Navegación desde navbar

---

## ✅ Fase 7: Integración con Usuarios (30 minutos)

### Objetivo

Mostrar tareas asignadas en el detalle del usuario.

### Tareas

**7.1 Crear `tareas-usuario-list.component.ts`**

Componente anidado que:

- Reciba `@Input() usuarioId: number`
- Cargue tareas del usuario usando signal
- Use effect para actualizaciones reactivas
- Muestre estadísticas (completadas, pendientes, etc.)

**7.2 Integrar en `detalle-usuario.component.html`**

```html
<app-tareas-usuario-list [usuarioId]="usuario.id"></app-tareas-usuario-list>
```

**7.3 Computed Signals para Estadísticas**

```typescript
tareasPendientes = computed(() => 
  this.tareasUsuario().filter(t => t.estado === EstadoTarea.PENDIENTE)
);

tasaCompletude = computed(() => {
  const total = this.tareasUsuario().length;
  if (total === 0) return 0;
  return Math.round((this.tareasCompletadas().length / total) * 100);
});
```

### Criterios de Aceptación

- ✅ Componente anidado recibiendo Input
- ✅ Actualización reactiva con effects
- ✅ Estadísticas calculadas correctamente
- ✅ Vista de lista compacta
- ✅ Navegación a detalle de tarea

---

## ✅ Fase 8: Utilidades y Validaciones (30 minutos)

### Objetivo

Crear servicios auxiliares para lógica reutilizable.

### Tareas

**8.1 Crear `tarea-utilities.service.ts`**

Métodos auxiliares:

```typescript
// Verificación de estados
esTareaVencida(tarea: Tarea): boolean
esTareaUrgente(tarea: Tarea): boolean
calcularDiasRestantes(fechaVencimiento: Date): number

// Información visual
obtenerClaseEstado(estado: EstadoTarea): string
obtenerIconoPrioridad(prioridad: PrioridadTarea): string
obtenerColorPrioridad(prioridad: PrioridadTarea): string

// Ordenamiento
ordenarTareas(tareas: Tarea[]): Tarea[]

// Estadísticas
calcularEstadisticas(tareas: Tarea[]): EstadisticasTareas
```

**8.2 Crear `tarea-validation.service.ts`**

Validadores personalizados:

```typescript
validarFechaFutura(control: AbstractControl): ValidationErrors | null
validarAsignacionUsuario(control: AbstractControl): ValidationErrors | null
```

### Criterios de Aceptación

- ✅ Servicios con `@Injectable({ providedIn: 'root' })`
- ✅ Métodos puros y testeables
- ✅ Documentación JSDoc en cada método
- ✅ Uso de constantes del sistema

---

## ✅ Fase 9: Validaciones y Manejo de Errores (20 minutos)

### Objetivo

Implementar validaciones robustas y manejo de errores.

### Tareas

**9.1 Validación de Tipos en Rutas**

Convertir IDs de string a number:

```typescript
const idNumerico = Number(params['id']);
if (isNaN(idNumerico)) {
  this.notificacionService.error('Error', 'ID inválido');
  this.router.navigate(['/tareas']);
  return of(null);
}
```

**9.2 Manejo de Errores en Servicio**

```typescript
if (indice === -1) {
  const appError: AppError = {
    status: 404,
    message: 'Tarea no encontrada'
  };
  return throwError(() => appError);
}
```

**9.3 Validaciones de Formulario**

- Fecha de vencimiento debe ser futura
- Si estado es COMPLETADA, fecha completada es requerida
- Título mínimo 3 caracteres, máximo 100

### Criterios de Aceptación

- ✅ Conversión de tipos segura
- ✅ Errores capturados y mostrados
- ✅ Navegación en caso de error
- ✅ Mensajes de error descriptivos

---

## ✅ Fase 10: Documentación y Pulido (30 minutos)

### Objetivo

Documentar el código y ajustar detalles finales.

### Tareas

**10.1 Documentar con JSDoc**

Cada método público debe tener:

```typescript
/**
 * Obtiene una tarea por su ID
 * @param id - Identificador único de la tarea
 * @returns Observable con la tarea encontrada o undefined
 */
```

**10.2 Crear Archivos de Documentación**

- `ARCHITECTURE.md`: Diagrama de arquitectura
- `TASKS_FEATURE.md`: Documentación del módulo de tareas
- Actualizar `README.md` con nueva funcionalidad

**10.3 Ajustes Finales**

- Verificar estilos responsivos
- Probar navegación completa
- Revisar mensajes de notificación
- Ajustar budgets en `angular.json` si es necesario

### Criterios de Aceptación

- ✅ JSDoc en servicios y métodos principales
- ✅ Documentación técnica completa
- ✅ README actualizado con screenshots
- ✅ No hay errores de compilación
- ✅ No hay warnings de linting

---

## 🎓 Criterios de Evaluación General

### Funcionalidad (40%)

- [ ] CRUD completo funcionando (10%)
- [ ] Filtros y búsqueda operativos (8%)
- [ ] Validaciones correctas (8%)
- [ ] Integración con usuarios (7%)
- [ ] Navegación fluida (7%)

### Arquitectura (25%)

- [ ] Uso correcto de Signals y Computed (8%)
- [ ] Servicios con responsabilidad única (6%)
- [ ] Lazy loading implementado (6%)
- [ ] Separación de concerns (5%)

### Código Limpio (20%)

- [ ] Nombres descriptivos (5%)
- [ ] Código sin duplicación (5%)
- [ ] Comentarios y documentación (5%)
- [ ] Estructura de archivos clara (5%)

### UI/UX (15%)

- [ ] Interfaz intuitiva (5%)
- [ ] Feedback visual adecuado (5%)
- [ ] Responsividad (5%)

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Angular Signals](https://angular.io/guide/signals)
- [Reactive Forms](https://angular.io/guide/reactive-forms)
- [Angular Router](https://angular.io/guide/router)
- [Lazy Loading](https://angular.io/guide/lazy-loading-ngmodules)

### Patrones de Diseño

- Service Layer Pattern
- Component Communication
- State Management con Signals
- Form Validation Patterns

### Herramientas

- Angular DevTools
- Chrome DevTools
- RxJS Operator Decision Tree

---

## 🚀 Entregables

1. **Código fuente completo** en repositorio Git
2. **README.md actualizado** con:
   - Screenshots del módulo de tareas
   - Instrucciones de instalación
   - Guía de uso
3. **Documentación técnica**:
   - ARCHITECTURE.md
   - TASKS_FEATURE.md
4. **Video demo** (opcional): 3-5 minutos mostrando funcionalidad

---

## ⏱️ Tiempo Estimado Total

**4-5 horas** distribuidas en:

- Modelo y servicio: 50 min
- Componentes CRUD: 2h 30min
- Integración: 1h
- Documentación: 30 min

---

## 💡 Tips y Mejores Prácticas

1. **Comienza por el modelo**: Define bien las interfaces antes de escribir código
2. **Testea incrementalmente**: Prueba cada fase antes de continuar
3. **Usa signals consistentemente**: No mezcles signals con observables innecesariamente
4. **Valida temprano**: Agrega validaciones desde el principio
5. **Commits frecuentes**: Haz commit al finalizar cada fase
6. **Console logging**: Usa LoggerService para debugging
7. **Responsive first**: Diseña pensando en mobile desde el inicio

---

## 🐛 Problemas Comunes y Soluciones

### Error: ExpressionChangedAfterItHasBeenCheckedError

**Solución**: Usar `setTimeout()` o `allowSignalWrites: true` en effects

### Error: Usuario ID viene como string

**Solución**: Convertir explícitamente con `Number(id)`

### Error: Tareas no se actualizan en lista de usuario

**Solución**: Usar effect con `allowSignalWrites` para observar cambios en signal de tareas

### Error: Formulario no se pre-puebla en modo edición

**Solución**: Usar observables de rutas, no snapshots

---

## 🔧 Ejercicios Adicionales: Detección y Corrección de Bugs

Una vez completada la implementación básica, identifica y corrige los siguientes problemas detectados en la aplicación:

### Ejercicio 1: Validación de fecha de vencimiento

**Problema detectado**: Si la fecha de vencimiento está en el pasado, el campo se valida visualmente en verde pero no permite crear la tarea.

**Tareas**:

- Investiga por qué ocurre esta inconsistencia entre la validación visual y la funcional
- Corrige la validación para que muestre claramente el error cuando la fecha sea anterior a la fecha actual
- Asegura que el mensaje de error sea descriptivo para el usuario

---

### Ejercicio 2: Filtro de estados "Canceladas" y "Todos"

**Problema detectado**: Si se filtra por estado "Canceladas" (cuando no hay tareas canceladas) y luego se cambia a "Todos los estados", no se cargan tareas. Sin embargo, de "Pendiente" a "Todos" sí funciona correctamente.

**Tareas**:

- Reproduce el bug filtrando en el orden: Canceladas → Todos
- Identifica el problema en la lógica del filtro (probablemente en el servicio o componente)
- Corrige el bug para que el filtro "Todos" siempre muestre todas las tareas disponibles
- Verifica que funcione correctamente desde cualquier estado previo

---

### Ejercicio 3: Filtros de prioridad y asignado

**Problema detectado**: Comportamiento similar al Ejercicio 2. Cuando se filtra por un valor que no tiene resultados y luego se cambia a una opción que sí tiene datos, no se actualizan los resultados.

**Tareas**:

- Identifica si es el mismo problema que el Ejercicio 2 o tiene una causa diferente
- Corrige la lógica de filtrado para prioridades
- Corrige la lógica de filtrado para usuarios asignados
- Implementa una solución reutilizable que evite este problema en todos los filtros

---

### Ejercicio 4: Footer no responsivo

**Problema detectado**: El footer en la página de tareas no se adapta correctamente a dispositivos móviles.

**Tareas**:

- Inspecciona el footer con las herramientas de desarrollo en diferentes tamaños de pantalla
- Identifica los elementos que causan problemas de diseño responsivo
- Aplica CSS Grid o Flexbox para hacer el footer completamente responsivo
- Prueba en al menos tres breakpoints: mobile (< 768px), tablet (768px-1024px), desktop (> 1024px)

---

### Ejercicio 5: Validación de fecha de vencimiento obligatoria

**Problema detectado**: Es posible crear una tarea sin especificar fecha de vencimiento.

**Tareas**:

- Analiza si este comportamiento es correcto según los requisitos del negocio
- Si decides que la fecha debe ser obligatoria:
  - Añade la validación `Validators.required` al campo
  - Actualiza el mensaje de ayuda en el formulario
  - Actualiza la interfaz `Tarea` si es necesario
- Si decides que la fecha es opcional:
  - Documenta esta decisión en el código
  - Asegura que la UI maneje correctamente tareas sin fecha
  - Implementa una lógica de ordenamiento que coloque tareas sin fecha al final de la lista

---

## 🎉 ¡Éxito!

Al completar este laboratorio habrás implementado un módulo completo de gestión de tareas siguiendo las mejores prácticas de Angular 21, con arquitectura escalable y código mantenible.

**¡Buena suerte!** 🚀
