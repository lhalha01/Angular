
# Signals

---

## 📚 Objetivos de Aprendizaje

Al completar este laboratorio, serás capaz de:

1. ✅ Entender la diferencia entre `BehaviorSubject` y `Signals`
2. ✅ Migrar servicios de RxJS a Signals
3. ✅ Usar `effect()` para reactividad automática
4. ✅ Usar `computed()` para valores derivados
5. ✅ Refactorizar componentes para eliminar suscripciones manuales
6. ✅ Entender cuándo mantener Observables y cuándo usar Signals
7. ✅ Mejorar el rendimiento y reducir código boilerplate

---

## 🎯 Pre-requisitos

Asegúrate de tener:

- Angular 18+ instalado (Esta práctica se realiza en Angular 21)
- Conocimiento básico de RxJS y Observables
- Familiaridad con `BehaviorSubject`
- Entendimiento de decoradores como `@Injectable`

---

## 📋 Estructura del Laboratorio

```
PASO 1: Entender Signals (Teoría + Práctica)
├─ PASO 1.1: Migrar un Servicio Simple (NotificacionService)
├─ PASO 1.2: Migrar un Servicio Complejo (UsuarioService)
├─ PASO 1.3: Migrar un Servicio con Lógica (PaginacionService)
│
PASO 2: Usar Signals en Componentes
├─ PASO 2.1: Componente Simple con Signal Directo (NotificacionesComponent)
├─ PASO 2.2: Componente con Computed (HomeComponent)
├─ PASO 2.3: Componente con Effect (ListaUsuariosComponent)
├─ PASO 2.4: Componente con Paginación (PaginacionComponent)
│
PASO 3: Backward Compatibility
└─ PASO 3.1: Mantener Observables para Educación (ComponenteReactivo)
```

---

---

# PASO 1: Entender Signals

## Conceptos Fundamentales

### ¿Qué es un Signal?

Un **Signal** es una forma reactiva de almacenar y actualizar estado en Angular 18+. Es más simple y eficiente que `BehaviorSubject` para estado síncrono.

| Aspecto               | BehaviorSubject               | Signal                     |
| --------------------- | ----------------------------- | -------------------------- |
| **Tipo**        | Observable                    | Estado reactivo            |
| **Access**      | `.value` o `.subscribe()` | `signal()`               |
| **Update**      | `.next()`                   | `.set()` o `.update()` |
| **Template**    | `\| async` pipe              | `signal()`               |
| **Cleanup**     | `.unsubscribe()`            | Automático                |
| **Complejidad** | Más código                  | Menos código              |

---

# componente-reactivo.component.ts

### Cambio 1: Añade comentario educativo sobre Observable derivado de Signal y aplica type casting

**Por qué:** Para explicar la interoperabilidad entre Signals y Observables, demostrando que es posible combinar Signals (convertidos a Observables) con operadores RxJS como combineLatest, y garantizar la compatibilidad de tipos.

****Antes:****

```ts
private inicializarEstadisticas(): void {
  this.estadisticas$ = combineLatest([
    this.usuarioService.usuarios$,
    this.observablesService.obtenerEstadoServidor(),
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/componente-reactivo/componente-reactivo.component.ts#L181-L186 -->

```ts
private inicializarEstadisticas(): void {
  // Nota educativa: usuarios$ es un Observable derivado del Signal
  // para demostrar composición con combineLatest
  this.estadisticas$ = combineLatest([
    this.usuarioService.usuarios$ as Observable<Usuario[]>,
    this.observablesService.obtenerEstadoServidor(),
```

# home.component.html

### Cambio 1: Añade paréntesis para invocar el signal computed

**Por qué:** Los signals en templates se acceden como funciones ejecutándolas con paréntesis para obtener su valor reactivo actual, a diferencia de las propiedades normales que se acceden directamente.

****Antes:****

```txt
@if (totalUsuarios > 0) {  
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/home/home.component.html#L12-L12 -->

```txt
@if (totalUsuarios() > 0) {
```

---

### Cambio 2: Añade paréntesis para invocar el signal computed en la interpolación

**Por qué:** Consistente con el Cambio 1, los signals deben invocarse como funciones para acceder a su valor y mantener la reactividad en el template.

****Antes:****

```txt
<div class="stat-number">{{ totalUsuarios }}</div>
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/home/home.component.html#L14-L14 -->

```txt
<div class="stat-number">{{ totalUsuarios() }}</div>
```

# home.component.ts

### Cambio 1: Refactoriza componente completo de Observables/RxJS a Signals

**Por qué:** Para simplificar drásticamente el código eliminando suscripciones manuales, los lifecycle hooks OnInit y OnDestroy, el patrón destroy$ con takeUntil, y usar computed() para valores derivados reactivos. Esto reduce el boilerplate, elimina memory leaks potenciales, y mejora la legibilidad y mantenibilidad del código.

****Antes:****

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-home',
  imports: [DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class Home implements OnInit, OnDestroy {
  totalUsuarios = 0;
  fechaActual = new Date();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
    this.usuarioService.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe((usuarios: Usuario[]) => {
        this.totalUsuarios = usuarios.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navegarAUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }

  navegarAAgregar(): void {
    this.router.navigate(['/agregar-usuario']);
  }
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/home/home.component.ts -->

```ts
import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-home',
  imports: [DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class Home {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  fechaActual = new Date();

  // Signal computado que depende del signal de usuarios
  totalUsuarios = computed(() => this.usuarioService.usuarios().length);

  navegarAUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }

  navegarAAgregar(): void {
    this.router.navigate(['/agregar-usuario']);
  }
}

```

---

# lista-usuarios.component.html

### Cambio 1: Reemplaza async pipe por invocación directa del signal

**Por qué:** Con Signals no se necesita el async pipe ni el operador de navegación segura (?./??) ya que se accede directamente al valor del signal, simplificando el template y eliminando la complejidad de los Observables.

****Antes:****

```txt
@if ((usuariosPaginados$ | async)?.length ?? 0 > 0) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html#L27-L27 -->

```txt
@if (usuariosPaginados().length > 0) {
```

---

### Cambio 2: Reemplaza async pipe por invocación directa del signal en el loop

**Por qué:** Elimina la necesidad del async pipe en el @for loop, accediendo directamente al array desde el signal, lo que resulta en sintaxis más limpia y mejor rendimiento al no necesitar el pipe.

****Antes:****

```txt
@for (usuario of usuariosPaginados$ | async; track usuario.id) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html#L29-L29 -->

```txt
@for (usuario of usuariosPaginados(); track usuario.id) {
```

---

### Cambio 3: Convierte propiedad cargando a signal con invocación

**Por qué:** Al migrar la propiedad booleana a signal, se debe invocar como función para obtener su valor reactivo en el template.

****Antes:****

```txt
@if (usuariosFiltrados.length === 0 && !cargando) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html#L91-L91 -->

```txt
@if (usuariosFiltrados.length === 0 && !cargando()) {
```

---

### Cambio 4: Invoca signal de cargando en condición de template

**Por qué:** Mantiene consistencia en el acceso al signal de cargando en todas las partes del template.

****Antes:****

```txt
@if (cargando) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html#L116-L116 -->

```txt
@if (cargando()) {
```

---

### Cambio 5: Simplifica acceso al modal eliminando async pipe y estructura de alias

**Por qué:** Con Signals no se necesita el pipe async ni crear una variable de alias (as modalState), se accede directamente al valor del signal invocándolo, simplificando la estructura del template.

****Antes:****

```txt
@if (modalEliminar$ | async; as modalState) {
  @if (modalState.isOpen) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html#L124-L125 -->

```txt
@if (modalEliminar().isOpen) {
  <div class="modal-overlay" (click)="cancelarEliminacion()">
```

---

### Cambio 6: Reemplaza interpolación dinámica por texto estático de advertencia

**Por qué:** Cambio en el diseño del mensaje del modal para mostrar un texto de advertencia genérico en lugar del nombre del usuario específico.

****Antes:****

```txt
<p>¿Está seguro que desea eliminar al usuario <strong>{{ modalState.usuario?.nombre }}</strong>?</p>
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html#L132-L132 -->

```txt
<p class="warning-text">Esta acción no se puede deshacer.</p>
```

---

### Cambio 7: Elimina cierre de bloque redundante

**Por qué:** Ajuste en la estructura del template para corregir el anidamiento de bloques condicionales @if.

****Antes:****

```txt
}
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html#L144-L144 -->

```txt

```

# lista-usuarios.component.ts

### Cambio 1: Actualiza imports reemplazando lifecycle hooks y RxJS por Signals

**Por qué:** Se reemplazan OnDestroy por signal, effect y computed de Angular Core ya que los Signals no requieren cleanup manual. Se eliminan las importaciones de Observable, Subject y takeUntil de RxJS que ya no son necesarias.

****Antes:****

```ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L1-L1 -->

```ts
import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
```

---

### Cambio 2: Elimina imports de RxJS y AsyncPipe innecesarios con Signals

**Por qué:** Al migrar a Signals, ya no se necesitan BehaviorSubject, Observable ni Subject de RxJS para el estado del componente, ni el AsyncPipe para acceder a valores en el template, simplificando las dependencias.

****Antes:****

```ts
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { PaginacionService } from '../../services/paginacion.service';
import { LoggerService } from '../../services/logger.service';
import { Usuario } from '../../models/usuario.model';
import { NombreCompletoPipe } from '../../pipes/nombre-completo.pipe';
import { ResaltarIdParDirective } from '../../directives/resaltar-id-par.directive';
import { Paginacion } from '../paginacion/paginacion.component';
import { AppError } from '../../models/app-error.model';
import { environment } from '../../../environments/environment';

interface ModalEliminarState {
  isOpen: boolean;
  usuario?: { id: number; nombre: string };
}

@Component({
  selector: 'app-lista-usuarios',
  imports: [
    FormsModule,
    AsyncPipe,
    UpperCasePipe,
    NombreCompletoPipe,
    ResaltarIdParDirective,
    Paginacion,
  ],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss',
})
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L4-L32 -->

```ts
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { PaginacionService } from '../../services/paginacion.service';
import { LoggerService } from '../../services/logger.service';
import { Usuario } from '../../models/usuario.model';
import { NombreCompletoPipe } from '../../pipes/nombre-completo.pipe';
import { ResaltarIdParDirective } from '../../directives/resaltar-id-par.directive';
import { Paginacion } from '../paginacion/paginacion.component';
import { AppError } from '../../models/app-error.model';
import { environment } from '../../../environments/environment';

interface ModalEliminarState {
  isOpen: boolean;
  usuario?: { id: number; nombre: string };
}

@Component({
  selector: 'app-lista-usuarios',
  imports: [
    FormsModule,
    UpperCasePipe,
    NombreCompletoPipe,
    ResaltarIdParDirective,
    Paginacion,
  ],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss',
})
```

---

### Cambio 3: Elimina interfaz OnDestroy de la clase

**Por qué:** Con Signals no se necesita implementar OnDestroy ni manejar limpieza de suscripciones manualmente, ya que los Signals gestionan automáticamente su cleanup.

****Antes:****

```ts
export class ListaUsuarios implements OnInit, OnDestroy {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L33-L33 -->

```ts
export class ListaUsuarios implements OnInit {
```

---

### Cambio 4: Convierte propiedades a signals y elimina destroy$ Subject

**Por qué:** Se migran cargando, usuariosPaginados y modalEliminar de propiedades/Observables a signals para aprovechar la reactividad nativa de Angular. Se elimina destroy$ ya que no hay suscripciones manuales que limpiar.

****Antes:****

```ts
cargando = false;
private destroy$ = new Subject<void>();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L37-L41 -->

```ts
cargando = signal(false);

// Signals que reemplazan los BehaviorSubject
usuariosPaginados = signal<Usuario[]>([]);
modalEliminar = signal<ModalEliminarState>({ isOpen: false });
```

---

### Cambio 5: Reemplaza BehaviorSubjects y Observables por signals

**Por qué:** Los signals de usuariosPaginados y modalEliminar reemplazan completamente el patrón BehaviorSubject/Observable, eliminando la complejidad de manejar subjects y la necesidad de exponer observables separados.

****Antes:****

```ts
// Observable para usuarios paginados
private usuariosPaginadosSubject = new BehaviorSubject<Usuario[]>([]);
usuariosPaginados$ = this.usuariosPaginadosSubject.asObservable();

// Estado modal unificado
private modalEliminarSubject = new BehaviorSubject<ModalEliminarState>({ isOpen: false });
modalEliminar$: Observable<ModalEliminarState> = this.modalEliminarSubject.asObservable();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L49-L116 -->

```ts
constructor() {
  // Effect que se ejecuta automáticamente cuando cambia la configuración de paginación
  effect(() => {
    this.paginacionService.configuracion();
    this.actualizarUsuariosPaginados();
  });
}

ngOnInit(): void {
  this.cargarUsuarios();
}

cargarUsuarios(): void {
  this.cargando.set(true);
  // Acceder directamente al signal sin necesidad de async pipe o suscripción
  const usuarios = this.usuarioService.usuariosProcesados();
  this.usuarios = usuarios;
  this.filtrarUsuarios();
  this.cargando.set(false);
}

filtrarUsuarios(): void {
  if (this.filtroTexto.trim()) {
    const filtroLower = this.filtroTexto.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(
      (usuario: Usuario) =>
        usuario.name.toLowerCase().includes(filtroLower) ||
        usuario.email.toLowerCase().includes(filtroLower),
    );
  } else {
    this.usuariosFiltrados = [...this.usuarios];
  }

  // Actualizar paginación y reiniciar a la primera página
  this.paginacionService.actualizarConfiguracion(this.usuariosFiltrados.length);
  this.paginacionService.reiniciarPaginacion();
  this.actualizarUsuariosPaginados();
}

private actualizarUsuariosPaginados(): void {
  const usuariosPaginados = this.paginacionService.obtenerElementosPaginados(
    this.usuariosFiltrados,
  );
  this.usuariosPaginados.set(usuariosPaginados);
}

onCambioElementosPorPagina(nuevoTamano: number): void {
  this.paginacionService.actualizarConfiguracion(this.usuariosFiltrados.length, nuevoTamano);
  this.actualizarUsuariosPaginados();
}

verDetalleUsuario(id: number): void {
  this.router.navigate(['/usuarios', id]);
}

navegarAAgregar(): void {
  this.router.navigate(['/agregar-usuario']);
}

eliminarUsuario(id: number, nombre: string): void {
  this.modalEliminar.set({
    isOpen: true,
    usuario: { id, nombre },
  });
}

confirmarEliminacion(): void {
  const modalState = this.modalEliminar();
```

---

### Cambio 6: Reemplaza configurarPaginacion() con constructor y effect()

**Por qué:** El effect() se ejecuta automáticamente cuando cambia el signal de configuración, eliminando la necesidad de suscripciones manuales con pipe(takeUntil()). Los métodos de carga y filtrado se simplifican al acceder directamente a los signals.

****Antes:****

```ts
ngOnInit(): void {
  this.cargarUsuarios();
}

private configurarPaginacion(): void {
  this.paginacionService.configuracion$.pipe(takeUntil(this.destroy$)).subscribe(() => {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L124-L52 -->

```ts

```

---

### Cambio 7: Simplifica cargarUsuarios() eliminando suscripción y manejo de errores async

**Por qué:** Con Signals se accede directamente al valor usando usuariosProcesados() en lugar de suscribirse a un Observable, eliminando el callback async, el manejo de errores con subscribe, y simplificando el control del estado de carga con signal.set().

****Antes:****

```ts
this.cargando = true;
this.usuarioService.usuariosProcesados$.pipe(takeUntil(this.destroy$)).subscribe({
  next: (usuarios: Usuario[]) => {
    this.usuarios = usuarios;
    this.filtrarUsuarios();
    this.configurarPaginacion();

    this.cargando = false;
  },
  error: (error: AppError) => {
    this.logger.error('Error al cargar usuarios:', error.message);
    this.cargando = false;

    this.notificacionService.error(
      'Error al cargar usuarios',
      'No se pudieron cargar los usuarios. Por favor, recargue la página.',
    );
  },
});
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L57-L60 -->

```ts




```

---

### Cambio 8: Reemplaza next() del Subject por set() del signal

**Por qué:** En actualizarUsuariosPaginados(), se cambia de usuariosPaginadosSubject.next() a usuariosPaginados.set() siguiendo el API de Signals para actualizar el estado.

****Antes:****

```ts
this.usuariosPaginadosSubject.next(usuariosPaginados);
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L62-L67 -->

```ts
this.cargando.set(true);
// Acceder directamente al signal sin necesidad de async pipe o suscripción
const usuarios = this.usuarioService.usuariosProcesados();
this.usuarios = usuarios;
this.filtrarUsuarios();
this.cargando.set(false);
```

---

### Cambio 9: Cambia next() del Subject por set() del signal en eliminarUsuario()

**Por qué:** Actualiza el patrón de emisión de estado del modal de modalEliminarSubject.next() al método set() de signals.

****Antes:****

```ts
this.modalEliminarSubject.next({
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L92-L92 -->

```ts
this.usuariosPaginados.set(usuariosPaginados);
```

---

### Cambio 10: Accede al valor del signal con invocación en lugar de .value

**Por qué:** Los signals se leen invocándolos como funciones modalEliminar() en lugar de acceder a la propiedad .value de BehaviorSubject.

****Antes:****

```ts
const modalState = this.modalEliminarSubject.value;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L109-L109 -->

```ts
this.modalEliminar.set({
```

---

### Cambio 11: Elimina operador takeUntil() innecesario con Signals

**Por qué:** Al migrar a Signals, se elimina la llamada al servicio que retornaba Observable con .pipe(takeUntil()), ya que ya no hay suscripciones que requieran limpieza manual.

****Antes:****

```ts
.pipe(takeUntil(this.destroy$))
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L116-L116 -->

```ts
const modalState = this.modalEliminar();
```

---

### Cambio 12: Elimina método ngOnDestroy() y cleanup de Subject

**Por qué:** Con Signals no se necesita implementar ngOnDestroy() para limpiar suscripciones, ya que los signals y effects se gestionan automáticamente por Angular, eliminando el riesgo de memory leaks.

****Antes:****

```ts
  this.modalEliminarSubject.next({ isOpen: false });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts#L150-L150 -->

```ts
this.modalEliminar.set({ isOpen: false });
```

# notificaciones.component.html

### Cambio 1: Invoca signal de notificaciones en el loop @for

**Por qué:** Los signals en templates se acceden como funciones con paréntesis para obtener el array de notificaciones y mantener la reactividad automática.

****Antes:****

```txt
@for (notificacion of notificaciones; track notificacion.id) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/notificaciones/notificaciones.component.html#L2-L2 -->

```txt
@for (notificacion of notificaciones(); track notificacion.id) {
```

# notificaciones.component.ts

### Cambio 1: Actualiza imports eliminando OnDestroy y Subscription, añadiendo inject

**Por qué:** Se elimina OnDestroy ya que no hay suscripciones que limpiar con Signals, se elimina Subscription de RxJS, y se añade inject para inyección moderna de dependencias y el import de NotificacionService.

****Antes:****

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/notificaciones/notificaciones.component.ts#L1-L3 -->

```ts
import { Component, OnInit, inject } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificacionService, Notificacion } from '../../services/notificacion.service';
```

---

### Cambio 2: Elimina OnDestroy, suscripción manual y conecta directamente al signal del servicio

**Por qué:** En lugar de crear una propiedad local y suscribirse manualmente al Observable del servicio, se accede directamente al signal del servicio, eliminando todo el boilerplate de suscripción y cleanup. Usa inject() para dependency injection moderna.

****Antes:****

```ts
export class Notificaciones implements OnInit, OnDestroy {
  notificaciones: Notificacion[] = [];
  private suscripcion: Subscription = new Subscription();

  constructor(private notificacionService: NotificacionService) {}
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/notificaciones/notificaciones.component.ts#L22-L26 -->

```ts
export class Notificaciones implements OnInit {
  private notificacionService = inject(NotificacionService);

  // Acceso directo a las notificaciones desde el signal del servicio
  notificaciones = this.notificacionService.notificaciones;
```

---

### Cambio 3: Elimina ngOnInit(), suscripción manual y ngOnDestroy()

**Por qué:** Con Signals no se necesita suscribirse manualmente en ngOnInit() ni limpiar la suscripción en ngOnDestroy(). El componente reacciona automáticamente a los cambios del signal, simplificando drásticamente el lifecycle del componente.

****Antes:****

```ts
  this.suscripcion = this.notificacionService.notificaciones$.subscribe((notificaciones: Notificacion[]) => {
    this.notificaciones = notificaciones;
  });
}

ngOnDestroy(): void {
  this.suscripcion.unsubscribe();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/notificaciones/notificaciones.component.ts#L29-L29 -->

```ts
// No es necesario suscribirse, el signal se actualiza automáticamente
```

# paginacion.component.html

### Cambio 1: Invoca signals en condiciones del template

**Por qué:** La configuración ahora es un signal, por lo que debe invocarse como función configuracion() en ambas partes de la condición para acceder a su valor reactivo.

****Antes:****

```txt
@if (configuracion && configuracion.totalPaginas > 1) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L1-L1 -->

```txt
@if (configuracion() && configuracion().totalPaginas > 1) {
```

---

### Cambio 2: Accede a propiedades del signal en interpolación

**Por qué:** Para acceder a propiedades anidadas del objeto de configuración, primero se invoca el signal configuracion() y luego se accede a totalElementos.

****Antes:****

```txt
de {{ configuracion.totalElementos }} resultados
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L8-L8 -->

```txt
de {{ configuracion().totalElementos }} resultados
```

---

### Cambio 3: Invoca signal para comparación en propiedad disabled

**Por qué:** La propiedad disabled del botón debe evaluar el valor actual del signal, por lo que se invoca configuracion() para acceder a paginaActual.

****Antes:****

```txt
[disabled]="configuracion.paginaActual === 1"
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L18-L18 -->

```txt
[disabled]="configuracion().paginaActual === 1"
```

---

### Cambio 4: Invoca signal en condición para mostrar elipsis

**Por qué:** La lógica para mostrar "..." requiere acceder al valor de paginaActual del signal de configuración.

****Antes:****

```txt
@if (!rangoCompleto && configuracion.paginaActual > 3) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L28-L28 -->

```txt
@if (!rangoCompleto && configuracion().paginaActual > 3) {
```

---

### Cambio 5: Invoca signal en condición duplicada de páginas visibles

**Por qué:** Esta línea también requiere invocar configuracion() como función para acceder a paginaActual del signal. Aparece en otra parte del template con la misma lógica para determinar si mostrar elementos de paginación.

****Antes:****

```txt
@if (!rangoCompleto && configuracion.paginaActual > 3) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L37-L37 -->

```txt
@if (!rangoCompleto && configuracion().paginaActual > 3) {
```

---

### Cambio 6: Invoca signal para comparar página activa en clase CSS

**Por qué:** La clase condicional 'activa' necesita comparar el número de página con paginaActual del signal, requiriendo la invocación de configuracion().

****Antes:****

```txt
[class.activa]="p�gina === configuracion.paginaActual"
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L47-L47 -->

```txt
[class.activa]="p�gina === configuracion().paginaActual"
```

---

### Cambio 7: Invoca signal en condición compuesta para elipsis final

**Por qué:** La lógica condicional necesita acceder tanto a paginaActual como totalPaginas del signal de configuración.

****Antes:****

```txt
@if (!rangoCompleto && configuracion.paginaActual < configuracion.totalPaginas - 2) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L54-L54 -->

```txt
@if (!rangoCompleto && configuracion().paginaActual < configuracion().totalPaginas - 2) {
```

---

### Cambio 8: Invoca signal en condición para mostrar última página

**Por qué:** Mantiene consistencia en el acceso al signal para determinar cuándo mostrar el botón de última página.

****Antes:****

```txt
@if (!rangoCompleto && configuracion.paginaActual < configuracion.totalPaginas - 2) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L61-L61 -->

```txt
@if (!rangoCompleto && configuracion().paginaActual < configuracion().totalPaginas - 2) {
```

---

### Cambio 9: Invoca signal en click handler y texto del botón

**Por qué:** Tanto el evento click como la interpolación del texto necesitan acceder a totalPaginas del signal de configuración.

****Antes:****

```txt
(click)="irAPagina(configuracion.totalPaginas)">
{{ configuracion.totalPaginas }}
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L64-L65 -->

```txt
(click)="irAPagina(configuracion().totalPaginas)">
{{ configuracion().totalPaginas }}
```

---

### Cambio 10: Invoca signal en comparación para deshabilitar botón siguiente

**Por qué:** La propiedad disabled debe comparar si la página actual es la última, accediendo a ambas propiedades del signal de configuración.

****Antes:****

```txt
[disabled]="configuracion.paginaActual === configuracion.totalPaginas"
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L74-L74 -->

```txt
[disabled]="configuracion().paginaActual === configuracion().totalPaginas"
```

---

### Cambio 11: Invoca signal en binding de value del select

**Por qué:** El value del select debe reflejar el valor actual de elementosPorPagina desde el signal de configuración.

****Antes:****

```txt
[value]="configuracion.elementosPorPagina"
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.html#L87-L87 -->

```txt
[value]="configuracion().elementosPorPagina"
```

# paginacion.component.ts

### Cambio 1: Actualiza imports eliminando lifecycle hooks y RxJS, añadiendo Signals

**Por qué:** Se eliminan OnInit, OnDestroy y Subscription ya que no se necesitan con Signals. Se añaden inject, effect para inyección de dependencias moderna y reactividad automática.

****Antes:****

```ts
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L1-L1 -->

```ts
import { Component, Output, EventEmitter, inject, effect } from '@angular/core';
```

---

### Cambio 2: Elimina interfaces OnInit y OnDestroy, conecta directamente al signal del servicio

**Por qué:** Con Signals no hay lifecycle hooks que implementar para suscripción/cleanup. La propiedad configuracion ahora es una referencia directa al signal del servicio, eliminando la necesidad de una propiedad local y suscripción manual.

****Antes:****

```ts
export class Paginacion implements OnInit, OnDestroy {
  configuracion: ConfiguracionPaginacion | null = null;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L10-L13 -->

```ts
export class Paginacion {
  private paginacionService = inject(PaginacionService);

  configuracion = this.paginacionService.configuracion;
```

---

### Cambio 3: Reemplaza suscripción manual en ngOnInit() por effect() en constructor

**Por qué:** El effect() se ejecuta automáticamente cuando el signal de configuración cambia, eliminando la necesidad de suscribirse manualmente y de almacenar la suscripción para cleanup posterior. Simplifica el lifecycle del componente.

****Antes:****

```ts
private suscripcion: Subscription = new Subscription();

constructor(private paginacionService: PaginacionService) {}

ngOnInit(): void {
  this.suscripcion = this.paginacionService.configuracion$.subscribe((configuracion: ConfiguracionPaginacion) => {
    this.configuracion = configuracion;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L19-L22 -->

```ts
constructor() {
  // Effect que se ejecuta automáticamente cuando cambia la configuración
  effect(() => {
    this.paginacionService.configuracion();
```

---

### Cambio 4: Elimina método ngOnDestroy() innecesario

**Por qué:** Con Signals y effects no hay suscripciones manuales que limpiar, por lo que ngOnDestroy() y el unsubscribe() se vuelven innecesarios, reduciendo el boilerplate.

****Antes:****

```ts
ngOnDestroy(): void {
  this.suscripcion.unsubscribe();
}
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L26-L26 -->

```ts

```

---

### Cambio 5: Invoca signal en lugar de acceder a propiedad en calcularRangoPaginas()

**Por qué:** La configuración ahora es un signal, por lo que debe invocarse como función configuracion() para obtener su valor actual.

****Antes:****

```ts
if (!this.configuracion) return;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L28-L28 -->

```ts
if (!this.configuracion()) return;
```

---

### Cambio 6: Accede al signal en cálculo de rangoCompleto

**Por qué:** Mantiene consistencia al acceder al valor del signal de configuración para calcular si se muestra el rango completo de páginas.

****Antes:****

```ts
this.rangoCompleto = this.paginasVisibles.length === this.configuracion.totalPaginas;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L31-L31 -->

```ts
this.rangoCompleto = this.paginasVisibles.length === this.configuracion().totalPaginas;
```

---

### Cambio 7: Invoca signal en getters computados de rango de elementos

**Por qué:** Los getters elementoDesde() y elementoHasta() necesitan acceder al valor actual del signal de configuración para calcular el rango de elementos mostrados en la página actual.

****Antes:****

```ts
if (!this.configuracion) return 0;
return (this.configuracion.paginaActual - 1) * this.configuracion.elementosPorPagina + 1;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L47-L48 -->

```ts
if (!this.configuracion()) return 0;
return (this.configuracion().paginaActual - 1) * this.configuracion().elementosPorPagina + 1;
```

---

### Cambio 8: Invoca signal en getter elementoHasta()

**Por qué:** Calcula el índice final de elementos mostrados accediendo a las propiedades del signal de configuración (paginaActual, elementosPorPagina, totalElementos).

****Antes:****

```ts
if (!this.configuracion) return 0;
const fin = this.configuracion.paginaActual * this.configuracion.elementosPorPagina;
return Math.min(fin, this.configuracion.totalElementos);
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/components/paginacion/paginacion.component.ts#L52-L54 -->

```ts
if (!this.configuracion()) return 0;
const fin = this.configuracion().paginaActual * this.configuracion().elementosPorPagina;
return Math.min(fin, this.configuracion().totalElementos);
```

# notificacion.service.ts

### Cambio 1: Actualiza imports eliminando RxJS y añadiendo signal

**Por qué:** Se elimina BehaviorSubject y Observable de RxJS ya que el estado se gestionará con Signals. Se añade signal de Angular Core para crear el estado reactivo.

****Antes:****

```ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/notificacion.service.ts#L1-L1 -->

```ts
import { Injectable, OnDestroy, signal } from '@angular/core';
```

---

### Cambio 2: Reemplaza BehaviorSubject + Observable por un único signal

**Por qué:** Un signal reemplaza completamente el patrón de BehaviorSubject privado + Observable público, simplificando el API del servicio y eliminando la necesidad de exponer dos propiedades separadas para el mismo estado.

****Antes:****

```ts
private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
public notificaciones$ = this.notificacionesSubject.asObservable();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/notificacion.service.ts#L16-L16 -->

```ts
public notificaciones = signal<Notificacion[]>([]);
```

---

### Cambio 3: Usa update() del signal en lugar de next() del Subject

**Por qué:** El método update() de signals permite actualizar el estado basado en el valor anterior de forma inmutable, reemplazando el patrón de leer .value, crear nuevo array y emitir con .next().

****Antes:****

```ts
const notificacionesActuales = this.notificacionesSubject.value;
this.notificacionesSubject.next([...notificacionesActuales, notificacion]);
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/notificacion.service.ts#L40-L40 -->

```ts
this.notificaciones.update(actual => [...actual, notificacion]);
```

---

### Cambio 4: Reemplaza lectura .value + filter + next por update() funcional

**Por qué:** update() permite transformar el estado actual de forma funcional e inmutable, eliminando múltiples líneas de código imperativo por una expresión funcional concisa.

****Antes:****

```ts
const notificacionesActuales = this.notificacionesSubject.value;
const notificacionesFiltradas = notificacionesActuales.filter((n: Notificacion) => n.id !== id);
this.notificacionesSubject.next(notificacionesFiltradas);
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/notificacion.service.ts#L54-L56 -->

```ts
this.notificaciones.update(actual =>
  actual.filter((n: Notificacion) => n.id !== id)
);
```

---

### Cambio 5: Usa set() del signal para reiniciar estado

**Por qué:** El método set() de signals permite establecer directamente un nuevo valor, reemplazando el .next() del BehaviorSubject con sintaxis más clara y directa.

****Antes:****

```ts
this.notificacionesSubject.next([]);
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/notificacion.service.ts#L67-L67 -->

```ts
this.notificaciones.set([]);
```

# paginacion.service.ts

### Cambio 1: Actualiza imports reemplazando RxJS por signal

**Por qué:** Se elimina BehaviorSubject y Observable de RxJS ya que el estado de paginación se gestionará completamente con Signals de Angular.

****Antes:****

```ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L1-L1 -->

```ts
import { Injectable, signal } from '@angular/core';
```

---

### Cambio 2: Convierte BehaviorSubject privado a signal público

**Por qué:** Un signal público reemplaza el patrón de Subject privado + Observable público, simplificando el API del servicio. Los signals son readonly por defecto en consumidores, manteniendo el encapsulamiento.

****Antes:****

```ts
private configuracionSubject = new BehaviorSubject<ConfiguracionPaginacion>({
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L15-L15 -->

```ts
public configuracion = signal<ConfiguracionPaginacion>({
```

---

### Cambio 3: Elimina exposición de Observable público innecesario

**Por qué:** Con signals ya no se necesita exponer un Observable separado (configuracion$), el signal mismo sirve como fuente de datos reactiva.

****Antes:****

```ts
public configuracion$ = this.configuracionSubject.asObservable();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L21-L21 -->

```ts

```

---

### Cambio 4: Reemplaza .value por invocación de signal en actualizarConfiguracion()

**Por qué:** Los signals se leen invocándolos como funciones en lugar de acceder a la propiedad .value de BehaviorSubject.

****Antes:****

```ts
const configuracionActual = this.configuracionSubject.value;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L25-L25 -->

```ts
const configuracionActual = this.configuracion();
```

### Cambio 5: Reemplaza .next() por .set() para actualizar configuración

**Por qué:** Los signals usan .set() para establecer nuevo valor completo del estado, reemplazando el .next() de BehaviorSubject con API más clara.

****Antes:****

```ts
this.configuracionSubject.next({
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L33-L33 -->

```ts
this.configuracion.set({
```

### Cambio 6: Invoca signal para leer valor actual en paginaSiguiente()

**Por qué:** Consistente con el patrón de lectura de signals, se invoca configuracion() en lugar de acceder a .value.

****Antes:****

```ts
const configuracionActual = this.configuracionSubject.value;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L42-L42 -->

```ts
const configuracionActual = this.configuracion();
```

---

### Cambio 7: Usa .set() para actualizar página siguiente

**Por qué:** Mantiene consistencia usando .set() del signal en lugar de .next() del BehaviorSubject.

****Antes:****

```ts
this.configuracionSubject.next({
```

**Después:**
.

```ts
this.configuracion.set({
```

---

### Cambio 8: Invoca signal en paginaAnterior()

**Por qué:** Lee el valor actual del signal de configuración para calcular la página anterior.

****Antes:****

```ts
const configuracionActual = this.configuracionSubject.value;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L53-L53 -->

```ts
const configuracionActual = this.configuracion();
```

---

### Cambio 9: Invoca signal en irAPagina()

**Por qué:** Accede al valor actual del signal para validar el número de página solicitado.

****Antes:****

```ts
const configuracionActual = this.configuracionSubject.value;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L60-L60 -->

```ts
const configuracionActual = this.configuracion();
```

---

### Cambio 10: Invoca signal en obtenerElementosPaginados()

**Por qué:** Lee la configuración actual del signal para calcular el rango de elementos a mostrar.

****Antes:****

```ts
const configuracion = this.configuracionSubject.value;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L67-L67 -->

```ts
const configuracion = this.configuracion();
```

---

### Cambio 11: Usa invocación de signal y .set() en reiniciarPaginacion()

**Por qué:** Lee el valor actual con configuracion() y establece el nuevo estado con .set(), reemplazando el patrón de .value y .next().

****Antes:****

```ts
const configuracionActual = this.configuracionSubject.value;
this.configuracionSubject.next({
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L75-L76 -->

```ts
const configuracionActual = this.configuracion();
this.configuracion.set({
```

---

### Cambio 12: Invoca signal en obtenerEstadoActual()

**Por qué:** Retorna el valor actual del signal de configuración invocándolo como función.

****Antes:****

```ts
const configuracion = this.configuracionSubject.value;
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/paginacion.service.ts#L83-L83 -->

```ts
const configuracion = this.configuracion();
```

# usuario.service.ts

### Cambio 1: Actualiza imports para usar Signals y toObservable

**Por qué:** Se añade signal de Angular Core para el estado reactivo y toObservable de rxjs-interop para mantener compatibilidad con componentes que aún usan Observables. Se elimina BehaviorSubject ya que será reemplazado por signals. Se mantiene catchError, map, tap para operaciones HTTP.

****Antes:****

```ts
 import { Injectable } from '@angular/core';
 import { HttpClient, HttpErrorResponse } from '@angular/common/http';
 import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
 import { catchError, map, tap } from 'rxjs/operators';
```

 **Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/usuario.service.ts#L1-L4 -->

```ts
import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
```

---

### Cambio 2: Reemplaza BehaviorSubjects por signals para usuarios

**Por qué:** Los signals de usuarios y usuariosProcesados reemplazan los BehaviorSubjects, simplificando la gestión del estado. Se eliminan las propiedades Observable asociadas (usuarios$ y usuariosProcesados$) ya que se crearán de otra forma.

****Antes:****

```ts
private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
public usuarios$ = this.usuariosSubject.asObservable();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/usuario.service.ts#L19-L21 -->

```ts
// Signals que reemplazan los BehaviorSubject
public usuarios = signal<Usuario[]>([]);
public usuariosProcesados = signal<Usuario[]>([]);
```

---

### Cambio 3: Crea Observable derivado del signal para retrocompatibilidad

**Por qué:** toObservable() convierte el signal usuarios en un Observable (usuarios$) para mantener compatibilidad con componentes educativos que aún demuestran el uso de RxJS y Observables. Esto permite una migración gradual.

****Antes:****

```ts
private usuariosProcesadosSubject = new BehaviorSubject<Usuario[]>([]);
public usuariosProcesados$ = this.usuariosProcesadosSubject.asObservable();
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/usuario.service.ts#L23-L24 -->

```ts
// Observable derivado del signal para compatibilidad con componentes educativos
public usuarios$ = toObservable(this.usuarios);
```

---

### Cambio 4: Usa .set() de signals en lugar de .next() en inicializarUsuarios()

**Por qué:** Actualiza los signals de usuarios y usuariosProcesados usando .set() en lugar de emitir valores con .next() de los BehaviorSubjects, siguiendo el API de Signals.

****Antes:****

```ts
this.usuariosSubject.next(this.usuariosMemoria);
this.usuariosProcesadosSubject.next(this.procesarUsuarios(this.usuariosMemoria));
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/usuario.service.ts#L41-L42 -->

```ts
this.usuarios.set(this.usuariosMemoria);
this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));
```

---

### Cambio 5: Usa .set() de signals en agregarUsuario()

**Por qué:** Después de agregar un usuario a la memoria, actualiza ambos signals (usuarios y usuariosProcesados) usando .set() en lugar de .next(), manteniendo consistencia en el patrón de actualización de estado.

****Antes:****

```ts
this.usuariosSubject.next([...this.usuariosMemoria]);
this.usuariosProcesadosSubject.next(this.procesarUsuarios(this.usuariosMemoria));
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/usuario.service.ts#L104-L105 -->

```ts
this.usuarios.set([...this.usuariosMemoria]);
this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));
```

---

### Cambio 6: Usa .set() de signals en eliminarUsuario()

**Por qué:** Al eliminar un usuario de la memoria, actualiza los signals usando .set() para notificar el cambio de estado a todos los componentes suscritos, reemplazando el patrón de .next() de BehaviorSubjects.

****Antes:****

```ts
this.usuariosSubject.next([...this.usuariosMemoria]);
this.usuariosProcesadosSubject.next(this.procesarUsuarios(this.usuariosMemoria));
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Signals/solucion_lab/src/app/services/usuario.service.ts#L120-L121 -->

```ts
this.usuarios.set([...this.usuariosMemoria]);
this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));
```
