[[_TOC_]]

# Lab 14.2: HTTP y capa de datos — interceptores y DTOs en la aplicación de tareas

> Extraído de `../Lab 14.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 13.2](../../Lab%2013/Lab%2013.2/Lab%2013.2.md).

## Prerequisitos

- Lab 13 completado.
- Leer el capítulo [HTTP y capa de datos](./Introducción.md).
- La API pública de prueba que usaremos es `https://jsonplaceholder.typicode.com`.

---

## Fase 1 — Configurar HttpClient con interceptores (15 min)

En `app.config.ts`:

```typescript
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};
```

Implementa `authInterceptor` y `errorInterceptor` según el capítulo.

---

## Fase 2 — DTOs y mapeo (25 min)

La API de JSONPlaceholder devuelve `todos` como tareas. Crea el DTO y la función de mapeo:

```typescript
// features/tareas/models/tarea.dto.ts
export interface TareaDto {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

// Función de mapeo
export function mapearTarea(dto: TareaDto): Tarea {
  return {
    id:           dto.id,
    titulo:       dto.title,
    completada:   dto.completed,
    usuarioId:    dto.userId,
    prioridad:    'media',
    fechaCreacion: new Date()
  };
}
```

Actualiza `TareaService` para usar el DTO:

```typescript
getAll(): Observable<Tarea[]> {
  return this.http.get<TareaDto[]>('https://jsonplaceholder.typicode.com/todos?_limit=20').pipe(
    map(dtos => dtos.map(mapearTarea))
  );
}
```

---

## Fase 3 — Manejo de errores en servicio (15 min)

Añade gestión específica de 404:

```typescript
getById(id: number): Observable<Tarea | null> {
  return this.http.get<TareaDto>(`https://jsonplaceholder.typicode.com/todos/${id}`).pipe(
    map(mapearTarea),
    catchError((err: HttpErrorResponse) => err.status === 404 ? of(null) : throwError(() => err))
  );
}
```

---

## Fase 4 — Retry con backoff (10 min)

Añade reintentos al método `getAll()`:

```typescript
retry({
  count: 2,
  delay: (_, n) => timer(n * 1000)
})
```

Simula un error desconectando la red y verifica en la consola que reintenta.

---

## Criterios de aceptación

- La lista de tareas carga desde la API real (JSONPlaceholder).
- El token (simulado) se envía en el header `Authorization` gracias al interceptor.
- Los errores HTTP se notifican sin que el componente los gestione directamente.
- Acceder a un ID inexistente devuelve `null` sin romper la app.
- Los DTOs no salen fuera del servicio; los componentes solo ven `Tarea`.

## Entregable

Rama o commit. Captura de la pestaña Network mostrando el header `Authorization` y captura de la notificación de error en pantalla.
