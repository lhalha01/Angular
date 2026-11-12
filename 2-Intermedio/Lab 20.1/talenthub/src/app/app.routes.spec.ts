import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@core/services/auth.service';
import { Empleado, EmpleadoService } from '@features/empleados';
import { ProyectoService } from '@features/proyectos';
import { of } from 'rxjs';
import { routes } from './app.routes';

const empleado = (id: number, nombre: string): Empleado => ({
  id,
  nombre,
  email: `${nombre.toLowerCase()}@example.com`,
  rol: 'desarrollador',
  habilidades: [],
  disponible: true,
  proyectoActualId: null,
  fechaIncorporacion: new Date(2026, 0, 1),
});
const EMPLEADOS = [empleado(1, 'Ana'), empleado(2, 'Luis')];

/** Pruebas de integración con las rutas reales (carga diferida incluida) y un servicio de empleados simulado. */
describe('rutas de la aplicación', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: ProyectoService, useValue: { getAll: () => of([]) } },
        {
          provide: EmpleadoService,
          useValue: {
            getAll: () => of(EMPLEADOS),
            getById: (id: number) => of(EMPLEADOS.find((e) => e.id === id) ?? null),
          },
        },
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });
  afterEach(() => sessionStorage.clear());

  const iniciarSesion = () => TestBed.inject(AuthService).login('a', 'b');
  const texto = () => (harness.routeNativeElement as HTMLElement).textContent ?? '';

  describe('sin sesión', () => {
    it('/dashboard redirige a /login con el destino en returnUrl', async () => {
      await harness.navigateByUrl('/dashboard');
      expect(router.url).toBe('/login?returnUrl=%2Fdashboard');
    });

    it('/empleados/1 conserva el destino completo', async () => {
      await harness.navigateByUrl('/empleados/1');
      expect(router.url).toBe('/login?returnUrl=%2Fempleados%2F1');
    });

    it('la raíz y las rutas desconocidas también acaban en el login, recordando lo que se escribió', async () => {
      await harness.navigateByUrl('/');
      expect(router.url).toBe('/login?returnUrl=%2F');
      await harness.navigateByUrl('/no-existe');
      expect(router.url).toBe('/login?returnUrl=%2Fno-existe');
    });

    it('el login es accesible y no lleva el menú', async () => {
      await harness.navigateByUrl('/login');
      expect(router.url).toBe('/login');
      expect(texto()).toContain('Entrar');
      expect((harness.routeNativeElement as HTMLElement).querySelector('app-navbar')).toBeNull();
    });
  });

  describe('con sesión', () => {
    beforeEach(iniciarSesion);

    it('la raíz y las rutas desconocidas llevan al dashboard', async () => {
      await harness.navigateByUrl('/');
      expect(router.url).toBe('/dashboard');
      await harness.navigateByUrl('/no-existe');
      expect(router.url).toBe('/dashboard');
    });

    it('/empleados carga el directorio con los empleados', async () => {
      await harness.navigateByUrl('/empleados');
      await new Promise((r) => setTimeout(r, 350)); // el directorio espera 300 ms (debounce) antes de cargar
      harness.detectChanges();
      expect(texto()).toContain('Directorio de empleados');
      expect(texto()).toContain('Ana');
      expect(texto()).toContain('Luis');
    });

    it('/proyectos y /dashboard cargan su pantalla dentro del armazón', async () => {
      await harness.navigateByUrl('/proyectos');
      expect(texto()).toContain('Proyectos');
      expect((harness.routeNativeElement as HTMLElement).querySelector('app-navbar')).not.toBeNull();
      await harness.navigateByUrl('/dashboard');
      expect(texto()).toContain('Dashboard');
    });

    it('el detalle recibe el empleado desde el resolver (no aparece vacío)', async () => {
      await harness.navigateByUrl('/empleados/2');
      expect(texto()).toContain('Luis');
      expect(texto()).toContain('luis@example.com');
    });

    it('un empleado que no existe muestra «no encontrado» en lugar de una pantalla vacía', async () => {
      await harness.navigateByUrl('/empleados/999');
      expect(texto()).toContain('Empleado no encontrado');
    });

    it('al pasar de un empleado a otro, el perfil se actualiza', async () => {
      await harness.navigateByUrl('/empleados/1');
      expect(texto()).toContain('Ana');
      await harness.navigateByUrl('/empleados/2');
      expect(texto()).toContain('Luis');
    });

    it('«nuevo» no se confunde con un identificador', async () => {
      await harness.navigateByUrl('/empleados/nuevo');
      expect(texto()).toContain('Alta de empleado');
    });

    it('cerrar la sesión vuelve a proteger las rutas', async () => {
      await harness.navigateByUrl('/empleados');
      TestBed.inject(AuthService).logout();
      await harness.navigateByUrl('/proyectos');
      expect(router.url).toBe('/login?returnUrl=%2Fproyectos');
    });
  });

  describe('cambios sin guardar en el formulario de alta', () => {
    beforeEach(iniciarSesion);

    const escribirNombre = (valor: string) => {
      const input = (harness.routeNativeElement as HTMLElement).querySelector<HTMLInputElement>('input[name=nombre]')!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };

    it('sin cambios se puede salir sin preguntar', async () => {
      const confirmar = spyOn(window, 'confirm');
      await harness.navigateByUrl('/empleados/nuevo');
      await harness.navigateByUrl('/empleados');
      expect(confirmar).not.toHaveBeenCalled();
      expect(router.url).toBe('/empleados');
    });

    it('con cambios pide confirmación y, si se cancela, se queda en el formulario', async () => {
      const confirmar = spyOn(window, 'confirm').and.returnValue(false);
      await harness.navigateByUrl('/empleados/nuevo');
      escribirNombre('Marta');
      await harness.navigateByUrl('/empleados');
      expect(confirmar).toHaveBeenCalledOnceWith('¿Salir sin guardar los cambios?');
      expect(router.url).toBe('/empleados/nuevo');
    });

    it('con cambios pide confirmación y, si se acepta, sale', async () => {
      spyOn(window, 'confirm').and.returnValue(true);
      await harness.navigateByUrl('/empleados/nuevo');
      escribirNombre('Marta');
      await harness.navigateByUrl('/empleados');
      expect(router.url).toBe('/empleados');
    });
  });
});
