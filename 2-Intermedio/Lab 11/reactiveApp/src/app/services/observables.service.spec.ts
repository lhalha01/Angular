import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { ObservablesService } from './observables.service';
import { UsuarioService } from './usuario.service';

const usuarios: Usuario[] = [
  { id: 1, name: 'Ann Lee', username: 'annie', email: 'ann@x.com', avatar: '' },
  { id: 2, name: 'Bob Ray', username: 'bobby', email: 'bob@y.com', avatar: '' },
];

describe('ObservablesService', () => {
  let service: ObservablesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UsuarioService,
          useValue: {
            obtenerUsuarios: () => of(usuarios),
            obtenerUsuario: (id: number) => of(usuarios.find((u) => u.id === id)),
          },
        },
      ],
    });
    service = TestBed.inject(ObservablesService);
  });

  it('buscarUsuarios filtra por nombre, email o alias tras 300 ms', fakeAsync(() => {
    const resultados: Usuario[][] = [];
    for (const termino of ['ANN', 'bob@y', 'bobby', 'zzz']) {
      service.buscarUsuarios(termino).subscribe((r) => resultados.push(r));
    }
    tick(299);
    expect(resultados.length).toBe(0); // aún no ha pasado la latencia simulada
    tick(1);
    expect(resultados.map((r) => r.map((u) => u.id))).toEqual([[1], [2], [2], []]);
  }));

  it('obtenerEstadoServidor emite "Online" tras 100 ms', fakeAsync(() => {
    let estado = '';
    service.obtenerEstadoServidor().subscribe((e) => (estado = e));
    tick(99);
    expect(estado).toBe('');
    tick(1);
    expect(estado).toBe('Online');
  }));

  it('obtenerConfiguracion emite el objeto de configuración', fakeAsync(() => {
    let config: unknown;
    service.obtenerConfiguracion().subscribe((c) => (config = c));
    tick(150);
    expect(config).toEqual({ idioma: 'es', tema: 'claro' });
  }));

  it('peticionSimulada tarda 800, 400 y 600 ms según el número (500 por defecto)', fakeAsync(() => {
    const hechas: number[] = [];
    for (const n of [1, 2, 3, 9]) {
      service.peticionSimulada(n).subscribe(() => hechas.push(n));
    }
    tick(400);
    expect(hechas).toEqual([2]);
    tick(100);
    expect(hechas).toEqual([2, 9]);
    tick(100);
    expect(hechas).toEqual([2, 9, 3]);
    tick(200);
    expect(hechas).toEqual([2, 9, 3, 1]);
  }));

  it('peticionConError falla con probabilidad del 70 %', fakeAsync(() => {
    const random = spyOn(Math, 'random');
    let resultado: unknown;
    let error: Error | undefined;

    random.and.returnValue(0.5); // < 0.7 → error
    service.peticionConError().subscribe({ error: (e) => (error = e) });
    tick(500);
    expect(error?.message).toBe('Error simulado en la petición');

    random.and.returnValue(0.9); // ≥ 0.7 → éxito
    service.peticionConError().subscribe((r) => (resultado = r));
    tick(500);
    expect(resultado).toEqual({ data: 'Petición exitosa' });
  }));

  it('streamDatos emite 1, 2, 3… cada intervalo', fakeAsync(() => {
    let valores: number[] = [];
    service.streamDatos(1000).pipe(take(3), toArray()).subscribe((v) => (valores = v));
    tick(2000);
    expect(valores).toEqual([1, 2, 3]);
  }));

  it('validarEmailDisponible rechaza los emails ocupados sin distinguir mayúsculas', fakeAsync(() => {
    const resultados: boolean[] = [];
    service.validarEmailDisponible('TEST@example.com').subscribe((v) => resultados.push(v));
    service.validarEmailDisponible('libre@example.com').subscribe((v) => resultados.push(v));
    tick(500);
    expect(resultados).toEqual([false, true]);
  }));

  it('obtenerUsuarioPorId devuelve el usuario (o undefined) tras 300 ms', fakeAsync(() => {
    const resultados: (Usuario | undefined)[] = [];
    service.obtenerUsuarioPorId(2).subscribe((u) => resultados.push(u));
    service.obtenerUsuarioPorId(99).subscribe((u) => resultados.push(u));
    tick(300);
    expect(resultados).toEqual([usuarios[1], undefined]);
  }));

  it('crearObservablePersonalizado emite 5 mensajes y completa', fakeAsync(() => {
    const mensajes: string[] = [];
    let completo = false;
    service.crearObservablePersonalizado().subscribe({
      next: (m) => mensajes.push(m),
      complete: () => (completo = true),
    });
    tick(5000);
    expect(mensajes).toEqual(['Mensaje 1', 'Mensaje 2', 'Mensaje 3', 'Mensaje 4', 'Mensaje 5']);
    expect(completo).toBeTrue();
  }));

  it('crearObservablePersonalizado libera el temporizador al cancelar la suscripción', fakeAsync(() => {
    const mensajes: string[] = [];
    const sub = service.crearObservablePersonalizado().subscribe((m) => mensajes.push(m));
    tick(2000);
    sub.unsubscribe(); // si no limpiara el setInterval, fakeAsync fallaría por temporizadores pendientes
    expect(mensajes.length).toBe(2);
  }));

  it('emitirValoresMultiples emite 1 a 5 y completa', fakeAsync(() => {
    let valores: number[] = [];
    service.emitirValoresMultiples().pipe(toArray()).subscribe((v) => (valores = v));
    tick(3000);
    expect(valores).toEqual([1, 2, 3, 4, 5]);
  }));

  it('cargarDatosConProgreso avanza de 20 en 20 hasta "Carga completada"', fakeAsync(() => {
    const estados: { progreso: number; mensaje: string }[] = [];
    service.cargarDatosConProgreso().subscribe((e) => estados.push(e));
    tick(2500);
    expect(estados.map((e) => e.progreso)).toEqual([20, 40, 60, 80, 100, 100]);
    expect(estados[estados.length - 1].mensaje).toBe('Carga completada');
  }));
});
