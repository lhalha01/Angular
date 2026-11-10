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
