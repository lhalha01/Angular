import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor, mensajeDeError } from './error.interceptor';
import { NOTIFICAR_404 } from './http-context';

const API = 'http://localhost:8000';

describe('interceptores HTTP (con el cliente real y los dos en el orden de app.config)', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let avisos: NotificacionService;
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
    avisos = TestBed.inject(NotificacionService);
    router = TestBed.inject(Router);
  });
  afterEach(() => {
    backend.verify();
    sessionStorage.clear();
  });

  const mensajes = () => avisos.lista().map((n) => n.mensaje);
  const fallar = (url: string, status: number, contexto?: HttpContext) => {
    let error: { status: number } | undefined;
    http.get(url, contexto ? { context: contexto } : {}).subscribe({ error: (e) => (error = e) });
    backend.expectOne(url).flush('', { status, statusText: 'x' });
    return error;
  };

  describe('authInterceptor', () => {
    it('añade Authorization: Bearer <token> a las peticiones a la API cuando hay sesión', () => {
      auth.login('a@b.c', 'x');
      http.get(`${API}/users`).subscribe();
      const req = backend.expectOne(`${API}/users`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${auth.getToken()}`);
      expect(auth.getToken()).toMatch(/^[0-9a-f-]{36}$/);
      req.flush([]);
    });

    it('sin sesión no añade la cabecera', () => {
      http.get(`${API}/users`).subscribe();
      const req = backend.expectOne(`${API}/users`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });

    it('no envía el token a otras direcciones (terceros)', () => {
      auth.login('a@b.c', 'x');
      http.get('https://otro.example/datos').subscribe();
      const req = backend.expectOne('https://otro.example/datos');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('envía el token en todos los métodos', () => {
      auth.login('a@b.c', 'x');
      http.post(`${API}/users`, {}).subscribe();
      http.delete(`${API}/users/1`).subscribe();
      const reqs = backend.match(() => true);
      expect(reqs.map((r) => r.request.headers.get('Authorization'))).toEqual([`Bearer ${auth.getToken()}`, `Bearer ${auth.getToken()}`]);
      reqs.forEach((r) => r.flush({}));
    });
  });

  describe('errorInterceptor', () => {
    it('avisa cuando no hay conexión (estado 0)', () => {
      fallar(`${API}/users`, 0);
      expect(mensajes()).toEqual(['No se pudo conectar con el servidor. ¿Está arrancado el backend?']);
    });

    it('avisa del 403, del 404 y de los 5xx', () => {
      fallar(`${API}/a`, 403);
      fallar(`${API}/b`, 404);
      fallar(`${API}/c`, 500);
      fallar(`${API}/d`, 503);
      expect(mensajes()).toEqual([
        'No tienes permiso para hacer esto.',
        'No se encontró lo que buscabas.',
        'Error del servidor (500). Inténtalo de nuevo más tarde.',
        'Error del servidor (503). Inténtalo de nuevo más tarde.',
      ]);
    });

    it('avisa también de otros errores del cliente (p. ej. 422)', () => {
      fallar(`${API}/users`, 422);
      expect(mensajes()).toEqual(['La petición no se pudo completar (error 422).']);
    });

    it('no avisa del 404 si la petición lo marca como esperado (NOTIFICAR_404 = false)', () => {
      fallar(`${API}/users/999`, 404, new HttpContext().set(NOTIFICAR_404, false));
      expect(mensajes()).toEqual([]);
    });

    it('sigue avisando de otros errores aunque NOTIFICAR_404 sea false', () => {
      fallar(`${API}/users/1`, 500, new HttpContext().set(NOTIFICAR_404, false));
      expect(mensajes().length).toBe(1);
    });

    it('vuelve a lanzar el error para que el servicio decida qué hacer', () => {
      expect(fallar(`${API}/users`, 500)?.status).toBe(500);
    });

    it('no avisa de nada si la petición va bien', () => {
      http.get(`${API}/users`).subscribe();
      backend.expectOne(`${API}/users`).flush([]);
      expect(mensajes()).toEqual([]);
    });

    it('con un 401 cierra la sesión, avisa y lleva al login recordando la pantalla', async () => {
      auth.login('a@b.c', 'x');
      await router.navigateByUrl('/empleados/3');
      const navegar = spyOn(router, 'navigate').and.resolveTo(true);
      fallar(`${API}/users/3`, 401);
      expect(auth.estaAutenticado()).toBeFalse();
      expect(mensajes()).toEqual(['Tu sesión ha caducado. Inicia sesión de nuevo.']);
      expect(navegar).toHaveBeenCalledOnceWith(['/login'], { queryParams: { returnUrl: '/empleados/3' } });
    });

    it('con un 401 estando ya en el login no vuelve a navegar', () => {
      const navegar = spyOn(router, 'navigate');
      spyOnProperty(router, 'url').and.returnValue('/login?returnUrl=%2F');
      fallar(`${API}/users`, 401);
      expect(navegar).not.toHaveBeenCalled();
    });
  });

  describe('mensajeDeError', () => {
    const error = (status: number) => ({ status }) as never;
    it('devuelve null para el 404 cuando no debe avisarse y texto en el resto de casos', () => {
      expect(mensajeDeError(error(404), false)).toBeNull();
      expect(mensajeDeError(error(404), true)).toContain('No se encontró');
      expect(mensajeDeError(error(401), true)).toContain('sesión');
    });
  });
});
