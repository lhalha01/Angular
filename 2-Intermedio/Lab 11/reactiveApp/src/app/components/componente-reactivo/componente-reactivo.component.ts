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
