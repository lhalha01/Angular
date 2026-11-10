
# Modificación de la Aplicación con Observables

Vamos a utilizar nuestra aplicación de usuarios (Lab 10.1) y vamos a añadir un componente para poder ver el funcionamiento de la programación reactiva.
Para ello crearemos un componente que consumirá un observable servido por un servicio.

```bash

ng g component components/componente-reactivo --skip-tests

ng g service services/observables.service --skip-tests
```

Hemos creado el componente `<app-componente-reactivo>`  para realizar este ejercicio.

componente-reactivo.component.ts

<!-- embedme ../../../.labs/Revamping/Programacion_reactiva/solucion_lab/gestion-usuarios-app/src/app/components/componente-reactivo/componente-reactivo.component.ts -->

```ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, interval, of, forkJoin, combineLatest, throwError, timer } from 'rxjs';
import {
  map,
  filter,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  mergeMap,
  concatMap,
  tap,
  catchError,
  retry,
  take,
  takeUntil,
  startWith,
  scan,
  delay
} from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';
import { ObservablesService } from '../../services/observables.service';
import { Usuario, NuevoUsuario } from '../../models/usuario.model';
import { LoggerService } from '../../services/logger.service';

interface EjemploLog {
  tipo: string;
  mensaje: string;
  timestamp: Date;
}

@Component({
  selector: 'app-componente-reactivo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './componente-reactivo.component.html',
  styleUrl: './componente-reactivo.component.scss',
})
export class ComponenteReactivo implements OnInit, OnDestroy {
  private usuarioService = inject(UsuarioService);
  private observablesService = inject(ObservablesService);
  private logger = inject(LoggerService);

  // Subject para gestionar la destrucción del componente
  private destroy$ = new Subject<void>();

  // === EJEMPLO 1: Búsqueda con debounceTime y distinctUntilChanged ===
  busquedaUsuario = '';
  private busquedaSubject = new Subject<string>();
  resultadosBusqueda$: Observable<Usuario[]> = new Observable();

  // === EJEMPLO 2: Validación de email en tiempo real ===
  email = '';
  private emailSubject = new Subject<string>();
  emailValido$: Observable<boolean> = new Observable();

  // === EJEMPLO 3: Contador con scan ===
  contadorClicks = 0;
  private clickSubject = new Subject<void>();

  // === EJEMPLO 4: Combinación de múltiples observables ===
  usuarioSeleccionado: Usuario | null = null;
  estadisticas$: Observable<any> = new Observable();

  // === EJEMPLO 5: Operadores de transformación (switchMap, mergeMap, concatMap) ===
  operadorActual = 'switchMap';
  resultadosOperador: string[] = [];

  // === EJEMPLO 6: Manejo de errores ===
  intentosReintentos = 0;
  errorManejado = '';

  // Logs para visualización
  logs: EjemploLog[] = [];

  // Control de ejemplos activos
  ejemplosActivos = {
    busqueda: false,
    email: false,
    contador: false,
    estadisticas: false,
  };

  ngOnInit(): void {
    this.inicializarBusqueda();
    this.inicializarValidacionEmail();
    this.inicializarContador();
    this.inicializarEstadisticas();

    this.logger.info('RegistroUsuarios - Componente inicializado con ejemplos de Observables');
  }

  ngOnDestroy(): void {
    // Completar el subject para cancelar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.info('RegistroUsuarios - Componente destruido - Observables cancelados');
  }

  // ============================================================
  // EJEMPLO 1: Búsqueda con debounceTime y distinctUntilChanged
  // ============================================================
  private inicializarBusqueda(): void {
    this.resultadosBusqueda$ = this.busquedaSubject.pipe(
      tap((termino) => this.agregarLog('Búsqueda', `Término ingresado: "${termino}"`)),
      // Esperar 500ms después de que el usuario deje de escribir
      debounceTime(500),
      // Solo emitir si el valor cambió
      distinctUntilChanged(),
      tap((termino) => this.agregarLog('Búsqueda', `Buscando después de debounce: "${termino}"`)),
      // Cambiar a una nueva búsqueda, cancelando la anterior
      switchMap((termino) => {
        if (!termino.trim()) {
          return of([]);
        }
        return this.observablesService
          .buscarUsuarios(termino)
          .pipe(
            tap((resultados) =>
              this.agregarLog('Búsqueda', `Encontrados ${resultados.length} resultados`),
            ),
          );
      }),
      // Cancelar suscripción al destruir componente
      takeUntil(this.destroy$),
    );
  }

  onBusquedaChange(termino: string): void {
    this.busquedaSubject.next(termino);
  }

  // ============================================================
  // EJEMPLO 2: Validación de email con operadores
  // ============================================================
  private inicializarValidacionEmail(): void {
    this.emailValido$ = this.emailSubject.pipe(
      tap((email) => this.agregarLog('Email', `Validando: ${email}`)),
      debounceTime(300),
      map((email) => {
        const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const esValido = patron.test(email);
        return esValido;
      }),
      distinctUntilChanged(),
      tap((valido) => this.agregarLog('Email', `Resultado: ${valido ? '✓ Válido' : '✗ Inválido'}`)),
      startWith(false),
      takeUntil(this.destroy$),
    );
  }

  onEmailChange(email: string): void {
    this.emailSubject.next(email);
  }

  // ============================================================
  // EJEMPLO 3: Contador con scan (similar a reduce)
  // ============================================================
  private inicializarContador(): void {
    this.clickSubject
      .pipe(
        tap(() => this.agregarLog('Contador', 'Click detectado')),
        // scan acumula valores como reduce pero emite en cada paso
        scan((acumulador) => acumulador + 1, 0),
        tap((total) => this.agregarLog('Contador', `Total de clicks: ${total}`)),
        takeUntil(this.destroy$),
      )
      .subscribe((total) => {
        this.contadorClicks = total;
      });
  }

  incrementarContador(): void {
    this.clickSubject.next();
  }

  // ============================================================
  // EJEMPLO 4: Combinación de observables con combineLatest
  // ============================================================
  private inicializarEstadisticas(): void {
    this.estadisticas$ = combineLatest([
      this.usuarioService.usuarios$,
      this.observablesService.obtenerEstadoServidor(),
      interval(5000).pipe(startWith(0)), // Actualiza cada 5 segundos
    ]).pipe(
      map(([usuarios, estado, tick]: [Usuario[], string, number]) => {
        this.agregarLog('Estadísticas', `Actualización #${tick + 1}`);
        return {
          totalUsuarios: usuarios.length,
          estadoServidor: estado,
          ultimaActualizacion: new Date(),
          usuariosActivos: usuarios.filter((u: Usuario) => u.id % 2 === 0).length,
        };
      }),
      takeUntil(this.destroy$),
    );
  }

  // ============================================================
  // EJEMPLO 5: Diferencias entre switchMap, mergeMap y concatMap
  // ============================================================
  demostrarOperadorTransformacion(): void {
    this.resultadosOperador = [];
    this.agregarLog('Operadores', `Demostrando ${this.operadorActual}`);

    // Simular 3 clicks rápidos
    const clicks$ = of(1, 2, 3);

    let operador$: Observable<string>;

    switch (this.operadorActual) {
      case 'switchMap':
        // switchMap: Cancela la petición anterior
        operador$ = clicks$.pipe(
          tap((num) => this.agregarLog('switchMap', `Click ${num}`)),
          switchMap((num) =>
            this.observablesService
              .peticionSimulada(num)
              .pipe(tap((resultado) => this.agregarLog('switchMap', resultado))),
          ),
        );
        break;

      case 'mergeMap':
        // mergeMap: Ejecuta todas en paralelo
        operador$ = clicks$.pipe(
          tap((num) => this.agregarLog('mergeMap', `Click ${num}`)),
          mergeMap((num) =>
            this.observablesService
              .peticionSimulada(num)
              .pipe(tap((resultado) => this.agregarLog('mergeMap', resultado))),
          ),
        );
        break;

      case 'concatMap':
        // concatMap: Espera a que termine una antes de empezar la siguiente
        operador$ = clicks$.pipe(
          tap((num) => this.agregarLog('concatMap', `Click ${num}`)),
          concatMap((num) =>
            this.observablesService
              .peticionSimulada(num)
              .pipe(tap((resultado) => this.agregarLog('concatMap', resultado))),
          ),
        );
        break;

      default:
        operador$ = of('Error: operador no reconocido');
    }

    operador$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (resultado) => {
        this.resultadosOperador.push(resultado);
      },
      complete: () => {
        this.agregarLog('Operadores', 'Demostración completada');
      },
    });
  }

  // ============================================================
  // EJEMPLO 6: Manejo de errores con retry y catchError
  // ============================================================
  probarManejoErrores(): void {
    this.intentosReintentos = 0;
    this.errorManejado = '';
    this.agregarLog('Errores', 'Iniciando petición con posible error');

    this.observablesService
      .peticionConError()
      .pipe(
        tap(() => {
          this.intentosReintentos++;
          this.agregarLog('Errores', `Intento #${this.intentosReintentos}`);
        }),
        // Reintentar 2 veces antes de fallar
        retry(2),
        // Capturar y manejar el error
        catchError((error) => {
          this.agregarLog('Errores', `Error capturado: ${error.message}`);
          this.errorManejado = error.message;
          // Retornar un observable de respaldo
          return of({ data: 'Datos de respaldo', error: true });
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (resultado: any) => {
          this.agregarLog('Errores', `Resultado final: ${JSON.stringify(resultado)}`);
        },
      });
  }

  // ============================================================
  // EJEMPLO 7: forkJoin - Esperar múltiples observables
  // ============================================================
  cargarDatosParalelos(): void {
    this.agregarLog('ForkJoin', 'Iniciando carga paralela de datos');

    forkJoin({
      usuarios: this.usuarioService.obtenerUsuarios().pipe(take(1)),
      estado: this.observablesService.obtenerEstadoServidor().pipe(take(1)),
      config: this.observablesService.obtenerConfiguracion().pipe(take(1)),
    })
      .pipe(
        tap(() => this.agregarLog('ForkJoin', 'Todas las peticiones completadas')),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (resultado) => {
          this.agregarLog(
            'ForkJoin',
            `Datos cargados: ${resultado.usuarios.length} usuarios, ` +
              `Estado: ${resultado.estado}, ` +
              `Config: ${JSON.stringify(resultado.config)}`,
          );
        },
        error: (error) => {
          this.agregarLog('ForkJoin', `Error: ${error.message}`);
        },
      });
  }

  // ============================================================
  // Utilidades
  // ============================================================
  private agregarLog(tipo: string, mensaje: string): void {
    this.logs.unshift({
      tipo,
      mensaje,
      timestamp: new Date(),
    });

    // Mantener solo los últimos 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(0, 50);
    }
  }

  limpiarLogs(): void {
    this.logs = [];
    this.agregarLog('Sistema', 'Logs limpiados');
  }

  toggleEjemplo(ejemplo: keyof typeof this.ejemplosActivos): void {
    this.ejemplosActivos[ejemplo] = !this.ejemplosActivos[ejemplo];
    this.agregarLog(
      'Sistema',
      `Ejemplo "${ejemplo}" ${this.ejemplosActivos[ejemplo] ? 'activado' : 'desactivado'}`,
    );
  }
}

```

componente-reactivo.component.html

<!-- embedme ../../../.labs/Revamping/Programacion_reactiva/solucion_lab/gestion-usuarios-app/src/app/components/componente-reactivo/componente-reactivo.component.html -->

```html
<div class="registro-usuarios-container">
  <h1>🔄 Ejemplos Prácticos de Observables en Angular</h1>
  <p class="descripcion">
    Esta página demuestra diferentes operadores y técnicas de RxJS para trabajar con Observables.
  </p>

  <div class="grid-ejemplos">

    <!-- EJEMPLO 1: Búsqueda con debounceTime -->
    <section class="ejemplo-card">
      <div class="ejemplo-header">
        <h2>🔍 Búsqueda con Debounce</h2>
        <span class="badge">debounceTime, distinctUntilChanged, switchMap</span>
      </div>
      <div class="ejemplo-body">
        <p class="explicacion">
          La búsqueda espera 500ms después de que dejes de escribir antes de realizar la consulta.
        </p>
        <div class="input-group">
          <input
            type="text"
            [(ngModel)]="busquedaUsuario"
            (ngModelChange)="onBusquedaChange($event)"
            placeholder="Buscar usuario..."
            class="input-primary"
          />
        </div>
        <div class="resultados" *ngIf="(resultadosBusqueda$ | async) as resultados">
          <div *ngIf="resultados.length > 0" class="lista-resultados">
            <div *ngFor="let usuario of resultados" class="usuario-item">
              <img [src]="usuario.avatar" [alt]="usuario.name || 'Avatar de usuario'" class="avatar-small" />
              <div>
                <strong>{{ usuario.name }}</strong>
                <div class="texto-small">{{ usuario.email }}</div>
              </div>
            </div>
          </div>
          <div *ngIf="resultados.length === 0 && busquedaUsuario" class="sin-resultados">
            No se encontraron resultados
          </div>
        </div>
      </div>
    </section>

    <!-- EJEMPLO 2: Validación de Email -->
    <section class="ejemplo-card">
      <div class="ejemplo-header">
        <h2>📧 Validación de Email</h2>
        <span class="badge">map, debounceTime, distinctUntilChanged</span>
      </div>
      <div class="ejemplo-body">
        <p class="explicacion">
          Valida el formato del email en tiempo real usando operadores de transformación.
        </p>
        <div class="input-group">
          <input
            type="email"
            [(ngModel)]="email"
            (ngModelChange)="onEmailChange($event)"
            placeholder="correo@ejemplo.com"
            class="input-primary"
            [class.input-valido]="(emailValido$ | async)"
            [class.input-invalido]="email && !(emailValido$ | async)"
          />
          <span class="validacion-icono" *ngIf="email">
            {{ (emailValido$ | async) ? '✓' : '✗' }}
          </span>
        </div>
        <div *ngIf="email" class="estado-validacion">
          <span [class.texto-exito]="(emailValido$ | async)"
                [class.texto-error]="!(emailValido$ | async)">
            {{ (emailValido$ | async) ? 'Email válido' : 'Email inválido' }}
          </span>
        </div>
      </div>
    </section>

    <!-- EJEMPLO 3: Contador con scan -->
    <section class="ejemplo-card">
      <div class="ejemplo-header">
        <h2>🔢 Contador Acumulativo</h2>
        <span class="badge">scan, tap</span>
      </div>
      <div class="ejemplo-body">
        <p class="explicacion">
          El operador <code>scan</code> acumula valores como reduce, pero emite en cada paso.
        </p>
        <div class="contador-display">
          <div class="numero-grande">{{ contadorClicks }}</div>
          <button (click)="incrementarContador()" class="btn btn-primary">
            Incrementar
          </button>
        </div>
      </div>
    </section>

    <!-- EJEMPLO 4: Estadísticas combinadas -->
    <section class="ejemplo-card">
      <div class="ejemplo-header">
        <h2>📊 Combinación de Observables</h2>
        <span class="badge">combineLatest, interval</span>
      </div>
      <div class="ejemplo-body">
        <p class="explicacion">
          Combina múltiples observables y se actualiza cuando cualquiera emite un nuevo valor.
        </p>
        <div *ngIf="(estadisticas$ | async) as stats" class="estadisticas-grid">
          <div class="stat-item">
            <span class="stat-label">Total Usuarios:</span>
            <span class="stat-value">{{ stats.totalUsuarios }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Estado Servidor:</span>
            <span class="stat-value estado-ok">{{ stats.estadoServidor }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Usuarios Activos:</span>
            <span class="stat-value">{{ stats.usuariosActivos }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Última Actualización:</span>
            <span class="stat-value">{{ stats.ultimaActualizacion | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- EJEMPLO 5: Operadores de transformación -->
    <section class="ejemplo-card card-ancho-completo">
      <div class="ejemplo-header">
        <h2>🔄 switchMap vs mergeMap vs concatMap</h2>
        <span class="badge">Operadores de transformación</span>
      </div>
      <div class="ejemplo-body">
        <p class="explicacion">
          <strong>switchMap:</strong> Cancela la petición anterior (ideal para búsquedas)<br>
          <strong>mergeMap:</strong> Ejecuta todas en paralelo (todas completan)<br>
          <strong>concatMap:</strong> Ejecuta secuencialmente (espera a que termine una antes de empezar la siguiente)
        </p>
        <div class="controles-operador">
          <select [(ngModel)]="operadorActual" class="select-primary" aria-label="Seleccionar operador de transformación">
            <option value="switchMap">switchMap</option>
            <option value="mergeMap">mergeMap</option>
            <option value="concatMap">concatMap</option>
          </select>
          <button (click)="demostrarOperadorTransformacion()" class="btn btn-secondary">
            Ejecutar Demo
          </button>
        </div>
        <div class="resultados-operador" *ngIf="resultadosOperador.length > 0">
          <h4>Resultados:</h4>
          <ul>
            <li *ngFor="let resultado of resultadosOperador">{{ resultado }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- EJEMPLO 6: Manejo de errores -->
    <section class="ejemplo-card">
      <div class="ejemplo-header">
        <h2>⚠️ Manejo de Errores</h2>
        <span class="badge">retry, catchError</span>
      </div>
      <div class="ejemplo-body">
        <p class="explicacion">
          Simula una petición que falla y demuestra cómo reintentar y capturar errores.
        </p>
        <button (click)="probarManejoErrores()" class="btn btn-warning">
          Probar Manejo de Errores
        </button>
        <div *ngIf="intentosReintentos > 0" class="info-reintentos">
          <p><strong>Intentos realizados:</strong> {{ intentosReintentos }}</p>
          <p *ngIf="errorManejado" class="texto-error">
            <strong>Error:</strong> {{ errorManejado }}
          </p>
        </div>
      </div>
    </section>

    <!-- EJEMPLO 7: forkJoin -->
    <section class="ejemplo-card">
      <div class="ejemplo-header">
        <h2>🚀 Carga Paralela</h2>
        <span class="badge">forkJoin</span>
      </div>
      <div class="ejemplo-body">
        <p class="explicacion">
          <code>forkJoin</code> espera a que todos los observables completen antes de emitir (similar a Promise.all).
        </p>
        <button (click)="cargarDatosParalelos()" class="btn btn-success">
          Cargar Datos en Paralelo
        </button>
      </div>
    </section>

  </div>

  <!-- Panel de Logs -->
  <section class="logs-panel">
    <div class="logs-header">
      <h2>📝 Registro de Eventos (Logs)</h2>
      <button (click)="limpiarLogs()" class="btn btn-small">Limpiar</button>
    </div>
    <div class="logs-body">
      <div *ngIf="logs.length === 0" class="sin-logs">
        No hay logs aún. Interactúa con los ejemplos arriba para ver la actividad.
      </div>
      <div class="log-item" *ngFor="let log of logs" [class]="'log-' + log.tipo.toLowerCase()">
        <span class="log-time">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
        <span class="log-tipo">[{{ log.tipo }}]</span>
        <span class="log-mensaje">{{ log.mensaje }}</span>
      </div>
    </div>
  </section>

</div>

```

componente-reactivo.component.scss

<!-- embedme ../../../.labs/Revamping/Programacion_reactiva/solucion_lab/gestion-usuarios-app/src/app/components/componente-reactivo/componente-reactivo.component.scss -->

```css
.registro-usuarios-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;

  h1 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 2.2rem;
  }

  .descripcion {
    color: #7f8c8d;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }
}

// Grid de ejemplos
.grid-ejemplos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

// Tarjetas de ejemplo
.ejemplo-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &.card-ancho-completo {
    grid-column: 1 / -1;
  }
}

.ejemplo-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.4rem;
  }

  .badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-family: 'Courier New', monospace;
  }
}

.ejemplo-body {
  padding: 1.5rem;

  .explicacion {
    color: #5a6c7d;
    margin-bottom: 1rem;
    line-height: 1.6;

    code {
      background: #f0f0f0;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #e74c3c;
    }
  }
}

// Inputs
.input-group {
  position: relative;
  margin-bottom: 1rem;
}

.input-primary {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &.input-valido {
    border-color: #27ae60;
  }

  &.input-invalido {
    border-color: #e74c3c;
  }
}

.validacion-icono {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
}

.estado-validacion {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

// Botones
.btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  &.btn-secondary {
    background: #3498db;
    color: white;
  }

  &.btn-warning {
    background: #f39c12;
    color: white;
  }

  &.btn-success {
    background: #27ae60;
    color: white;
  }

  &.btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

// Resultados de búsqueda
.resultados {
  margin-top: 1rem;
}

.lista-resultados {
  max-height: 300px;
  overflow-y: auto;
}

.usuario-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  .avatar-small {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  strong {
    display: block;
    color: #2c3e50;
  }

  .texto-small {
    font-size: 0.85rem;
    color: #7f8c8d;
  }
}

.sin-resultados {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

// Contador
.contador-display {
  text-align: center;
  padding: 2rem;

  .numero-grande {
    font-size: 4rem;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 1rem;
  }
}

// Estadísticas
.estadisticas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .stat-label {
    font-size: 0.9rem;
    color: #7f8c8d;
  }

  .stat-value {
    font-size: 1.3rem;
    font-weight: bold;
    color: #2c3e50;

    &.estado-ok {
      color: #27ae60;
    }
  }
}

// Operadores
.controles-operador {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.select-primary {
  flex: 1;
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
}

.resultados-operador {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;

  h4 {
    margin-top: 0;
    color: #2c3e50;
  }

  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.3rem 0;
    color: #5a6c7d;
  }
}

// Manejo de errores
.info-reintentos {
  background: #fff3cd;
  border-left: 4px solid #f39c12;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 4px;

  p {
    margin: 0.5rem 0;
  }
}

// Panel de logs
.logs-panel {
  background: #2c3e50;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.logs-header {
  background: #34495e;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    color: white;
    margin: 0;
    font-size: 1.3rem;
  }

  .btn-small {
    background: #e74c3c;
  }
}

.logs-body {
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.sin-logs {
  color: #95a5a6;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.log-item {
  padding: 0.5rem;
  margin-bottom: 0.3rem;
  border-radius: 4px;
  display: flex;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  color: #ecf0f1;

  .log-time {
    color: #95a5a6;
    font-size: 0.85rem;
  }

  .log-tipo {
    font-weight: bold;
    min-width: 100px;
  }

  .log-mensaje {
    flex: 1;
  }

  // Colores por tipo
  &.log-búsqueda .log-tipo {
    color: #3498db;
  }

  &.log-email .log-tipo {
    color: #9b59b6;
  }

  &.log-contador .log-tipo {
    color: #1abc9c;
  }

  &.log-estadísticas .log-tipo {
    color: #f39c12;
  }

  &.log-operadores .log-tipo,
  &.log-switchmap .log-tipo,
  &.log-mergemap .log-tipo,
  &.log-concatmap .log-tipo {
    color: #e67e22;
  }

  &.log-errores .log-tipo {
    color: #e74c3c;
  }

  &.log-forkjoin .log-tipo {
    color: #27ae60;
  }

  &.log-sistema .log-tipo {
    color: #95a5a6;
  }
}

// Información adicional
.info-adicional {
  margin-top: 2rem;

  h2 {
    color: #2c3e50;
    margin-bottom: 1.5rem;
  }
}

.conceptos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.concepto-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  h3 {
    margin: 0 0 0.8rem 0;
    font-size: 1.2rem;
  }

  p {
    margin: 0;
    line-height: 1.6;
    opacity: 0.95;
  }
}

// Utilidades de texto
.texto-exito {
  color: #27ae60;
}

.texto-error {
  color: #e74c3c;
}

// Responsive
@media (max-width: 768px) {
  .grid-ejemplos {
    grid-template-columns: 1fr;
  }

  .estadisticas-grid {
    grid-template-columns: 1fr;
  }

  .conceptos-grid {
    grid-template-columns: 1fr;
  }

  .controles-operador {
    flex-direction: column;
  }
}

```

observables.service.ts

<!-- embedme ../../../.labs/Revamping/Programacion_reactiva/solucion_lab/gestion-usuarios-app/src/app/services/observables.service.ts -->

```ts
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { UsuarioService } from './usuario.service';

/**
 * Servicio dedicado a proporcionar ejemplos de Observables
 * para fines educativos y demostración de operadores RxJS
 */
@Injectable({
  providedIn: 'root'
})
export class ObservablesService {
  private usuarioService = inject(UsuarioService);

  constructor() { }

  /**
   * EJEMPLO: Búsqueda de usuarios con delay simulado
   * Demuestra operaciones asíncronas y transformación de datos
   * Carga datos del UsuarioService
   */
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const terminoLower = termino.toLowerCase();

    // Obtener usuarios desde el servicio principal
    return this.usuarioService.obtenerUsuarios().pipe(
      delay(300), // Simula latencia de red adicional
      map(usuarios => usuarios.filter(usuario =>
        usuario.name.toLowerCase().includes(terminoLower) ||
        usuario.email.toLowerCase().includes(terminoLower) ||
        usuario.username.toLowerCase().includes(terminoLower)
      ))
    );
  }

  /**
   * EJEMPLO: Obtener estado del servidor
   * Demuestra observables que emiten valores simples
   */
  obtenerEstadoServidor(): Observable<string> {
    return of('Online').pipe(
      delay(100)
    );
  }

  /**
   * EJEMPLO: Obtener configuración
   * Demuestra observables que emiten objetos
   */
  obtenerConfiguracion(): Observable<{ idioma: string; tema: string }> {
    return of({
      idioma: 'es',
      tema: 'claro'
    }).pipe(
      delay(150)
    );
  }

  /**
   * EJEMPLO: Petición simulada con delay variable
   * Para demostrar diferencias entre switchMap, mergeMap y concatMap
   */
  peticionSimulada(numero: number): Observable<string> {
    // Cada petición tarda diferente tiempo para hacer más visible la diferencia
    const delays = [800, 400, 600];
    const delayTime = delays[numero - 1] || 500;

    return of(`Petición ${numero} completada`).pipe(
      delay(delayTime)
    );
  }

  /**
   * EJEMPLO: Petición que puede fallar
   * Para demostrar manejo de errores con retry y catchError
   */
  peticionConError(): Observable<{ data: string }> {
    // 70% de probabilidad de error
    return timer(500).pipe(
      switchMap(() => {
        if (Math.random() < 0.7) {
          return throwError(() => new Error('Error simulado en la petición'));
        }
        return of({ data: 'Petición exitosa' });
      })
    );
  }

  /**
   * EJEMPLO: Stream de datos en tiempo real
   * Demuestra observables que emiten múltiples valores
   */
  streamDatos(intervalo: number = 1000): Observable<number> {
    return timer(0, intervalo).pipe(
      map(tick => tick + 1)
    );
  }

  /**
   * EJEMPLO: Validación asíncrona (simula consulta a servidor)
   * Útil para demostrar validadores asíncronos en formularios
   */
  validarEmailDisponible(email: string): Observable<boolean> {
    // Simular consulta al servidor
    const emailsOcupados = ['test@example.com', 'admin@example.com'];

    return of(!emailsOcupados.includes(email.toLowerCase())).pipe(
      delay(500)
    );
  }

  /**
   * EJEMPLO: Obtener usuario por ID con delay
   * Demuestra operaciones de lectura individual
   * Carga datos del UsuarioService
   */
  obtenerUsuarioPorId(id: number): Observable<Usuario | undefined> {
    return this.usuarioService.obtenerUsuario(id).pipe(
      delay(300)
    );
  }

  /**
   * EJEMPLO: Crear observable personalizado
   * Demuestra cómo crear observables desde cero
   */
  crearObservablePersonalizado(): Observable<string> {
    return new Observable(subscriber => {
      let contador = 0;

      const intervalo = setInterval(() => {
        contador++;
        subscriber.next(`Mensaje ${contador}`);

        // Completar después de 5 mensajes
        if (contador >= 5) {
          subscriber.complete();
          clearInterval(intervalo);
        }
      }, 1000);

      // Cleanup cuando se cancela la suscripción
      return () => {
        clearInterval(intervalo);
      };
    });
  }

  /**
   * EJEMPLO: Observable que emite valores múltiples con delays
   * Para demostrar el comportamiento de diferentes operadores
   */
  emitirValoresMultiples(): Observable<number> {
    return new Observable(subscriber => {
      const valores = [1, 2, 3, 4, 5];
      let index = 0;

      const intervalo = setInterval(() => {
        if (index < valores.length) {
          subscriber.next(valores[index]);
          index++;
        } else {
          subscriber.complete();
          clearInterval(intervalo);
        }
      }, 500);

      return () => clearInterval(intervalo);
    });
  }

  /**
   * EJEMPLO: Simulación de carga de datos con progreso
   * Demuestra observables que emiten actualizaciones de estado
   */
  cargarDatosConProgreso(): Observable<{ progreso: number; mensaje: string }> {
    return new Observable(subscriber => {
      let progreso = 0;

      const intervalo = setInterval(() => {
        progreso += 20;

        subscriber.next({
          progreso,
          mensaje: `Cargando... ${progreso}%`
        });

        if (progreso >= 100) {
          subscriber.next({
            progreso: 100,
            mensaje: 'Carga completada'
          });
          subscriber.complete();
          clearInterval(intervalo);
        }
      }, 500);

      return () => clearInterval(intervalo);
    });
  }
}

```

Por último, necesitamos modificar un par de archivos para poder acceder al nuevo componente. Lo vamos a hacer utilizando routing para no impactar en el resto de componentes de la aplicación.

app.routes.ts

<!-- embedme ../../../.labs/Revamping/Programacion_reactiva/solucion_lab/gestion-usuarios-app/src/app/app.routes.ts#L6-L6 -->

```ts
import { ComponenteReactivo } from './components/componente-reactivo/componente-reactivo.component';
```

<!-- embedme ../../../.labs/Revamping/Programacion_reactiva/solucion_lab/gestion-usuarios-app/src/app/app.routes.ts#L25-L28 -->

```ts
{
  path: 'observables',
  component: ComponenteReactivo
},
```

Por último añadimos un botón en el componente `<app-header>` para navegar al componente.

header.component.html

<!-- embedme ../../../.labs/Revamping/Programacion_reactiva/solucion_lab/gestion-usuarios-app/src/app/layout/header/header.component.html#L21-L24-->

```html
<a routerLink="/observables" class="nav-link" routerLinkActive="active">
  <i class="icon-refresh"></i>
  Observables
</a>
```
