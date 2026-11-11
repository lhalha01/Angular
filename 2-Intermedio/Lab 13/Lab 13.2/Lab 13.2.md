[[_TOC_]]

# Lab 13.2: Router profesional — navegación segura de la aplicación de tareas y usuarios

> Extraído de `../Lab 13.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 12.2](../../Lab%2012/Lab%2012.2/Lab%2012.2.md).

## Prerequisitos

- Lab 12 completado (arquitectura por features en su sitio).
- Leer el capítulo [Router profesional](./Introducción.md).

---

## Fase 1 — Guard de autenticación (20 min)

Crea `src/app/core/guards/auth.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

Crea un `AuthService` mínimo que lea de `sessionStorage`:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  estaAutenticado(): boolean {
    return sessionStorage.getItem('auth_token') !== null;
  }
  login(token: string): void {
    sessionStorage.setItem('auth_token', token);
  }
  logout(): void {
    sessionStorage.removeItem('auth_token');
  }
}
```

---

## Fase 2 — Lazy loading por feature (20 min)

Actualiza `app.routes.ts`:

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'tareas', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./core/login/login.component').then(m => m.Login) },
  {
    path: 'tareas',
    canMatch: [authGuard],
    loadChildren: () => import('./features/tareas/tareas.routes').then(m => m.tareasRoutes)
  },
  {
    path: 'usuarios',
    canMatch: [authGuard],
    loadChildren: () => import('./features/usuarios/usuarios.routes').then(m => m.usuariosRoutes)
  },
  { path: '**', redirectTo: 'tareas' }
];
```

---

## Fase 3 — Resolver de datos (20 min)

Crea `features/tareas/resolvers/tarea.resolver.ts`:

```typescript
export const tareaResolver: ResolveFn<Tarea | null> = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(TareaService).getById(id).pipe(
    catchError(() => of(null))
  );
};
```

Aplícalo a la ruta de detalle:

```typescript
// tareas.routes.ts
{ path: ':id', component: DetalleTareaComponent, resolve: { tarea: tareaResolver } }
```

En el componente:

```typescript
readonly tarea = inject(ActivatedRoute).snapshot.data['tarea'] as Tarea | null;
```

---

## Fase 4 — Guard de cambios pendientes (10 min)

```typescript
export const cambiosPendientesGuard: CanDeactivateFn<{ tieneCambiosPendientes: () => boolean }> =
  (component) => component.tieneCambiosPendientes()
    ? confirm('¿Salir sin guardar los cambios?')
    : true;
```

Aplícalo al formulario de creación/edición de tareas.

---

## Criterios de aceptación

- Acceder a `/tareas` sin token redirige a `/login`.
- Tras "login" (almacenar token en sessionStorage), la navegación funciona.
- El detalle de una tarea recibe los datos desde el resolver (no hay pantalla vacía).
- El formulario de edición pide confirmación al intentar salir con cambios.
- Los chunks de cada feature se cargan de forma diferida (verificar en la pestaña Network del devtools).

## Entregable

Rama o commit con el sistema de routing. Captura de la pestaña Network mostrando los lazy chunks y captura del guard de login en funcionamiento.
