import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor, mensajeDeError } from './error.interceptor';
import { ERRORES_ESPERADOS, NOTIFICAR_ERRORES, OPERACION } from './http-context';

// `environment.apiUrl` es la API pública en los tests (la configuración base); se usa esa dirección como «nuestra API».
const API = 'https://jsonplaceholder.typicode.com';

describe('interceptores HTTP (con el cliente real y los dos en el orden de app.config)', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let toast: ToastService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });
  afterEach(() => {
    backend.verify();
    sessionStorage.clear();
  });

  const mensajes = () => toast.toasts().map((t) => t.message);
  const fallar = (url: string, status: number, contexto?: HttpContext, cuerpo: string | object = '') => {
    let error: { status: number } | undefined;
    http.get(url, contexto ? { context: contexto } : {}).subscribe({ error: (e) => (error = e) });
    backend.expectOne(url).flush(cuerpo, { status, statusText: 'x' });
    return error;
  };
  const con = (operacion: string, esperados: readonly number[] = [], notificar = true) =>
    new HttpContext().set(OPERACION, operacion).set(ERRORES_ESPERADOS, esperados).set(NOTIFICAR_ERRORES, notificar);

  describe('authInterceptor', () => {
    it('añade Authorization: Bearer <token> a las peticiones a la API cuando hay sesión', () => {
      auth.login('token-opaco');
      http.get(`${API}/todos`).subscribe();
      const req = backend.expectOne(`${API}/todos`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-opaco');
      req.flush([]);
    });

    it('sin sesión no añade la cabecera', () => {
      http.get(`${API}/todos`).subscribe();
      const req = backend.expectOne(`${API}/todos`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });

    it('no envía el token a otras direcciones (terceros)', () => {
      auth.login('token-opaco');
      http.get('https://otro.example/datos').subscribe();
      const req = backend.expectOne('https://otro.example/datos');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  describe('errorInterceptor', () => {
    it('avisa cuando no hay conexión (estado 0), con el texto de la operación', () => {
      fallar(`${API}/todos`, 0, con('No se pudieron cargar las tareas'));
      expect(mensajes()).toEqual([
        'No se pudieron cargar las tareas: no se pudo conectar con el servidor. ¿Está arrancado el backend?',
      ]);
    });

    it('avisa del 403, del 404 y de los 5xx', () => {
      fallar(`${API}/a`, 403);
      fallar(`${API}/b`, 404);
      fallar(`${API}/c`, 500, con('No se pudo eliminar la tarea'));
      expect(mensajes()).toEqual([
        'No tienes permiso para hacer esto.',
        'No se encontró lo que buscabas.',
        'No se pudo eliminar la tarea: error del servidor (500). Inténtalo de nuevo más tarde.',
      ]);
    });

    it('muestra el motivo que da el servidor (validación, 404 con detalle…)', () => {
      fallar(`${API}/a`, 422, con('No se pudo crear la tarea'), { detail: 'El usuario 1 no existe' });
      fallar(`${API}/b`, 404, con('No se pudo actualizar la tarea'), { detail: 'Tarea 4 no encontrada' });
      expect(mensajes()).toEqual([
        'No se pudo crear la tarea: El usuario 1 no existe.',
        'No se pudo actualizar la tarea: Tarea 4 no encontrada.',
      ]);
    });

    it('sin texto de operación usa uno genérico', () => {
      fallar(`${API}/a`, 422);
      expect(mensajes()).toEqual(['No se pudo completar la petición (error 422).']);
    });

    it('no avisa de los estados que la petición declara esperados', () => {
      fallar(`${API}/a`, 404, con('x', [404]));
      fallar(`${API}/b`, 409, con('x', [409]));
      expect(mensajes()).toEqual([]);
    });

    it('sigue avisando de los demás errores aunque haya estados esperados', () => {
      fallar(`${API}/a`, 500, con('x', [404]));
      expect(mensajes().length).toBe(1);
    });

    it('no avisa de nada si la petición pide silencio (NOTIFICAR_ERRORES = false)', () => {
      fallar(`${API}/a`, 500, con('x', [], false));
      expect(mensajes()).toEqual([]);
    });

    it('un mismo aviso no se repite mientras sigue visible (reintentos)', () => {
      fallar(`${API}/a`, 0, con('No se pudieron cargar las tareas'));
      fallar(`${API}/a`, 0, con('No se pudieron cargar las tareas'));
      fallar(`${API}/a`, 0, con('No se pudieron cargar las tareas'));
      expect(mensajes().length).toBe(1);
    });

    it('vuelve a lanzar el error para que el servicio decida qué hacer', () => {
      expect(fallar(`${API}/a`, 500)?.status).toBe(500);
    });

    it('no avisa de nada si la petición va bien', () => {
      http.get(`${API}/a`).subscribe();
      backend.expectOne(`${API}/a`).flush([]);
      expect(mensajes()).toEqual([]);
    });

    it('con un 401 cierra la sesión, avisa y lleva al login recordando la pantalla', async () => {
      auth.login('t');
      await router.navigateByUrl('/tasks/3');
      const navegar = spyOn(router, 'navigate').and.resolveTo(true);
      fallar(`${API}/todos/3`, 401);
      expect(auth.estaAutenticado()).toBeFalse();
      expect(mensajes()).toEqual(['Tu sesión ha caducado. Inicia sesión de nuevo.']);
      expect(navegar).toHaveBeenCalledOnceWith(['/login'], { queryParams: { returnUrl: '/tasks/3' } });
    });

    it('con un 401 estando ya en el login no vuelve a navegar', () => {
      const navegar = spyOn(router, 'navigate');
      spyOnProperty(router, 'url').and.returnValue('/login?returnUrl=%2F');
      fallar(`${API}/todos`, 401);
      expect(navegar).not.toHaveBeenCalled();
    });
  });

  describe('mensajeDeError', () => {
    const error = (status: number, cuerpo?: unknown) => ({ status, error: cuerpo }) as never;
    it('cada código da su texto', () => {
      expect(mensajeDeError(error(401), '')).toContain('sesión');
      expect(mensajeDeError(error(403), 'No se pudo borrar')).toBe('No se pudo borrar: no tienes permiso.');
      expect(mensajeDeError(error(404), 'No se pudo borrar')).toBe('No se pudo borrar: no se encontró.');
      expect(mensajeDeError(error(502), 'No se pudo borrar')).toContain('error del servidor (502)');
    });
  });
});
