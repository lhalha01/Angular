import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { Usuario } from '../../models/usuario.model';
import { LoggerService } from '../../services/logger.service';
import { UsuarioService } from '../../services/usuario.service';
import { ComponenteReactivo } from './componente-reactivo.component';

const usuarios: Usuario[] = [
  { id: 1, name: 'Ann Lee', username: 'annie', email: 'ann@x.com', avatar: '' },
  { id: 2, name: 'Bob Ray', username: 'bobby', email: 'bob@y.com', avatar: '' },
];

describe('ComponenteReactivo', () => {
  let fixture: ComponentFixture<ComponenteReactivo>;
  let c: ComponenteReactivo;
  const logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'warn', 'error']);

  const textos = () => c.logs.map((l) => `${l.tipo}: ${l.mensaje}`);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ComponenteReactivo],
      providers: [
        { provide: LoggerService, useValue: logger },
        {
          provide: UsuarioService,
          useValue: {
            usuarios$: of(usuarios),
            obtenerUsuarios: () => of(usuarios),
            obtenerUsuario: () => of(usuarios[0]),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(ComponenteReactivo);
    c = fixture.componentInstance;
  });

  it('el contador acumula los clics con scan', fakeAsync(() => {
    fixture.detectChanges();
    c.incrementarContador();
    c.incrementarContador();
    c.incrementarContador();
    expect(c.contadorClicks).toBe(3);
    fixture.destroy();
  }));

  it('la búsqueda espera 500 ms de pausa y solo consulta una vez (debounceTime)', fakeAsync(() => {
    fixture.detectChanges();
    // Tres pulsaciones seguidas: solo debe salir la última.
    c.onBusquedaChange('a');
    c.onBusquedaChange('an');
    c.onBusquedaChange('ann');
    tick(499);
    expect(textos().filter((t) => t.includes('Buscando después de debounce'))).toEqual([]);
    tick(1); // 500 ms: sale la búsqueda
    tick(300); // latencia simulada del servicio
    fixture.detectChanges();

    expect(textos().filter((t) => t.includes('Buscando después de debounce'))).toEqual([
      'Búsqueda: Buscando después de debounce: "ann"',
    ]);
    expect(fixture.nativeElement.querySelectorAll('.usuario-item').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Ann Lee');
    fixture.destroy();
  }));

  it('una búsqueda vacía no consulta y muestra "sin resultados"', fakeAsync(() => {
    fixture.detectChanges();
    c.busquedaUsuario = 'xyz';
    c.onBusquedaChange('xyz');
    tick(800);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se encontraron resultados');
    fixture.destroy();
  }));

  it('valida el formato del email en tiempo real', fakeAsync(() => {
    fixture.detectChanges();
    const valores: boolean[] = [];
    c.emailValido$.subscribe((v) => valores.push(v));

    c.onEmailChange('no-es-email');
    tick(300);
    c.onEmailChange('ann@x.com');
    tick(300);
    c.onEmailChange('otro@x.com'); // sigue siendo válido: distinctUntilChanged no vuelve a emitir
    tick(300);

    expect(valores).toEqual([false, false, true]); // startWith(false), inválido, válido
    fixture.destroy();
  }));

  describe('operadores de transformación (3 peticiones con 800, 400 y 600 ms)', () => {
    const ejecutar = (operador: string): string[] => {
      fixture.detectChanges();
      c.operadorActual = operador;
      c.demostrarOperadorTransformacion();
      tick(3000);
      const resultado = [...c.resultadosOperador];
      fixture.destroy();
      return resultado;
    };

    it('switchMap cancela las anteriores: solo llega la última', fakeAsync(() => {
      expect(ejecutar('switchMap')).toEqual(['Petición 3 completada']);
    }));

    it('mergeMap las ejecuta en paralelo: llegan por orden de finalización', fakeAsync(() => {
      expect(ejecutar('mergeMap')).toEqual([
        'Petición 2 completada',
        'Petición 3 completada',
        'Petición 1 completada',
      ]);
    }));

    it('concatMap las ejecuta en serie: llegan en el orden de entrada', fakeAsync(() => {
      expect(ejecutar('concatMap')).toEqual([
        'Petición 1 completada',
        'Petición 2 completada',
        'Petición 3 completada',
      ]);
    }));

    it('un operador desconocido informa del error', fakeAsync(() => {
      expect(ejecutar('otro')).toEqual(['Error: operador no reconocido']);
    }));
  });

  it('con un fallo permanente reintenta y usa los datos de respaldo (retry + catchError)', fakeAsync(() => {
    spyOn(Math, 'random').and.returnValue(0.1); // siempre falla
    fixture.detectChanges();
    c.probarManejoErrores();
    tick(1500); // 3 intentos de 500 ms (el original y 2 reintentos)

    expect(c.errorManejado).toBe('Error simulado en la petición');
    expect(textos()).toContain('Errores: Error capturado: Error simulado en la petición');
    expect(textos().some((t) => t.includes('Datos de respaldo'))).toBeTrue();
    fixture.destroy();
  }));

  it('si la petición funciona no usa los datos de respaldo', fakeAsync(() => {
    spyOn(Math, 'random').and.returnValue(0.9); // nunca falla
    fixture.detectChanges();
    c.probarManejoErrores();
    tick(500);

    expect(c.intentosReintentos).toBe(1);
    expect(c.errorManejado).toBe('');
    expect(textos().some((t) => t.includes('Petición exitosa'))).toBeTrue();
    fixture.destroy();
  }));

  it('forkJoin espera a todas las peticiones antes de emitir', fakeAsync(() => {
    fixture.detectChanges();
    c.cargarDatosParalelos();
    tick(149);
    expect(textos().some((t) => t.includes('Todas las peticiones completadas'))).toBeFalse();
    tick(1); // la más lenta es la configuración (150 ms)
    expect(textos()).toContain(
      'ForkJoin: Datos cargados: 2 usuarios, Estado: Online, Config: {"idioma":"es","tema":"claro"}',
    );
    fixture.destroy();
  }));

  it('combineLatest muestra las estadísticas combinadas', fakeAsync(() => {
    fixture.detectChanges();
    tick(100); // el estado del servidor llega a los 100 ms
    fixture.detectChanges();
    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('Total Usuarios:');
    expect(fixture.nativeElement.querySelector('.estadisticas-grid .stat-value').textContent).toContain('2');
    expect(texto).toContain('Online');
    fixture.destroy();
  }));

  it('al destruirse cancela las suscripciones (takeUntil)', fakeAsync(() => {
    fixture.detectChanges();
    c.incrementarContador();
    fixture.destroy();
    c.incrementarContador();
    expect(c.contadorClicks).toBe(1);
    expect(logger.info).toHaveBeenCalledWith(
      'RegistroUsuarios - Componente destruido - Observables cancelados',
    );
  }));

  it('los logs conservan como máximo 50 entradas y se pueden limpiar', fakeAsync(() => {
    fixture.detectChanges();
    for (let i = 0; i < 60; i++) {
      c.incrementarContador();
    }
    expect(c.logs.length).toBe(50);
    c.limpiarLogs();
    expect(c.logs.length).toBe(1);
    expect(c.logs[0].mensaje).toBe('Logs limpiados');
    fixture.destroy();
  }));

  it('toggleEjemplo activa y desactiva un ejemplo', fakeAsync(() => {
    fixture.detectChanges();
    c.toggleEjemplo('busqueda');
    expect(c.ejemplosActivos.busqueda).toBeTrue();
    c.toggleEjemplo('busqueda');
    expect(c.ejemplosActivos.busqueda).toBeFalse();
    fixture.destroy();
  }));
});
