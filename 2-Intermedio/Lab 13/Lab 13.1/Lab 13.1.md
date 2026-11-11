
[[_TOC_]]

# Lab 13.1: Router profesional — TalentHub: navegación segura

## Objetivo

Configurar el sistema de navegación de TalentHub con lazy loading por feature, guard de autenticación, resolver para el perfil de empleado y protección de cambios pendientes en el formulario de alta.

## Prerequisitos

- Lab 12 completado (estructura de carpetas lista).
- Leer el capítulo [Router profesional](./Introducción.md).

---

## Fase 1 — AuthGuard y AuthService (20 min)

```typescript
// core/services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  // NOTA: en producción el token lo emite el backend y no debe contener datos del usuario.
  // Aquí se simula con un identificador opaco solo para el ejercicio.
  private readonly TOKEN_KEY = 'talenthub_session';

  estaAutenticado(): boolean {
    return sessionStorage.getItem(this.TOKEN_KEY) !== null;
  }
  login(_email: string, _password: string): void {
    // Simulación: token opaco generado en frontend SOLO para el ejercicio de lab.
    // En una app real, el token lo devuelve el servidor tras validar las credenciales.
    const tokenSimulado = crypto.randomUUID();
    sessionStorage.setItem(this.TOKEN_KEY, tokenSimulado);
  }
  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
}

// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (_, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

Crea un componente `core/login/` sencillo que llame a `auth.login()` con cualquier email/contraseña.

---

## Fase 2 — Rutas principales con lazy loading (20 min)

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '',       redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login',  loadComponent: () => import('@core/login/login.component').then(m => m.Login) },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('@core/layout/shell/shell.component').then(m => m.Shell),
    children: [
      { path: 'dashboard',  loadChildren: () => import('@features/dashboard/dashboard.routes').then(m => m.dashboardRoutes) },
      { path: 'empleados',  loadChildren: () => import('@features/empleados/empleados.routes').then(m => m.empleadosRoutes) },
      { path: 'proyectos',  loadChildren: () => import('@features/proyectos/proyectos.routes').then(m => m.proyectosRoutes) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

---

## Fase 3 — EmpleadoResolver (15 min)

```typescript
// features/empleados/resolvers/empleado.resolver.ts
export const empleadoResolver: ResolveFn<Empleado | null> = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(EmpleadoService).getById(id).pipe(
    catchError(() => of(null))
  );
};

// empleados.routes.ts
export const empleadosRoutes: Routes = [
  { path: '',    component: DirectorioEmpleadosComponent },
  { path: 'nuevo', component: FormularioAltaComponent, canDeactivate: [cambiosPendientesGuard] },
  { path: ':id', component: PerfilEmpleadoComponent, resolve: { empleado: empleadoResolver } }
];
```

---

## Criterios de aceptación

- Acceder a `/dashboard` sin token redirige a `/login?returnUrl=%2Fdashboard`.
- Tras login, la navegación a `/empleados` carga el chunk lazy (verificar en Network).
- El detalle `/empleados/1` recibe los datos del empleado desde el resolver (sin pantalla vacía).
- El formulario de alta pide confirmación al intentar navegar con cambios sin guardar.

## Entregable

Rama `lab-13-router`. Capturas de Network (chunks lazy) y del guard en acción.
