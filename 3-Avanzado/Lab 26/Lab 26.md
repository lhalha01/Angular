
[[_TOC_]]

# ✅ Implementando Lazy Loading en Gestión de Usuarios

## 📋 Descripción de la práctica

En este laboratorio práctico aprenderás a transformar la aplicación **Gestión de Usuarios** para implementar **Lazy Loading** utilizando componentes standalone de Angular.

### Objetivos de Aprendizaje

Al completar este lab, serás capaz de:

- ✅ Identificar qué partes de una aplicación son candidatas para lazy loading
- ✅ Reestructurar rutas para usar `loadComponent` y `loadChildren`
- ✅ Organizar features en una arquitectura modular
- ✅ Configurar preloading strategies
- ✅ Analizar y verificar la optimización de bundles

---

## 📊 Análisis de la Aplicación Actual

### Estado Actual: Eager Loading

La aplicación actualmente carga **todos los componentes al inicio**:

```typescript
// app.routes.ts (ANTES - Eager Loading)
import { Home } from './components/home/home.component';
import { ListaUsuarios } from './components/lista-usuarios/lista-usuarios.component';
import { DetalleUsuario } from './components/detalle-usuario/detalle-usuario.component';
import { AgregarUsuario } from './components/agregar-usuario/agregar-usuario.component';
import { ComponenteReactivo } from './components/componente-reactivo/componente-reactivo.component';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'usuarios', component: ListaUsuarios },
  { path: 'usuarios/:id', component: DetalleUsuario },
  { path: 'agregar-usuario', component: AgregarUsuario },
  // ...
];
```

❌ **Problema**: Todos los imports son estáticos → Todo el código se incluye en el bundle inicial

### Rutas Actuales

| Ruta                    | Componente         | Tamaño Estimado     |
| ----------------------- | ------------------ | -------------------- |
| `/`                   | Home               | Pequeño             |
| `/usuarios`           | ListaUsuarios      | Grande               |
| `/usuarios/:id`       | DetalleUsuario     | Mediano              |
| `/agregar-usuario`    | AgregarUsuario     | Grande (formularios) |
| `/editar-usuario/:id` | AgregarUsuario     | Grande (formularios) |
| `/observables`        | ComponenteReactivo | Mediano              |

### Componentes y Dependencias

```
Home
├── UsuarioService
└── Router

ListaUsuarios (Grande)
├── UsuarioService
├── NotificacionService
├── PaginacionService
├── LoggerService
├── Paginacion component
└── UsuarioCard component
    ├── NombreCompletoPipe
    └── ResaltarIdParDirective

DetalleUsuario
├── UsuarioService
├── NotificacionService
└── Router

AgregarUsuario
├── UsuarioService
├── NotificacionService
├── CustomValidatorsService
└── FormBuilder (Reactive Forms)

ComponenteReactivo
└── ObservablesService
```

---

## 🎯 Estrategia de Lazy Loading

### Features Identificados

Agruparemos la aplicación en estos features:

1. **Home** (Eager) → Ruta principal, debe cargar rápido
2. **Usuarios Feature** (Lazy) → Lista, detalle, agregar, editar
3. **Observables Feature** (Lazy) → Ejemplos de observables/reactivos

### Nueva Estructura de Archivos

```
src/app/
├── app.routes.ts                    # Rutas principales
├── app.ts                           # Componente principal
├── app.config.ts                    # Configuración
├── components/
│   ├── home/                        # ✅ EAGER (pequeño, ruta inicial)
│   └── notificaciones/              # ✅ EAGER (se usa globalmente)
├── features/                        # 📁 NUEVA CARPETA
│   ├── usuarios/                    # 🔄 LAZY LOADING
│   │   ├── usuarios.routes.ts      # Rutas del feature
│   │   ├── lista/
│   │   │   ├── lista-usuarios.component.ts
│   │   │   ├── lista-usuarios.component.html
│   │   │   ├── lista-usuarios.component.scss
│   │   │   └── usuario-card/       # Nested component
│   │   ├── detalle/
│   │   │   ├── detalle-usuario.component.ts
│   │   │   ├── detalle-usuario.component.html
│   │   │   └── detalle-usuario.component.scss
│   │   └── formulario/             # Agregar + Editar
│   │       ├── formulario-usuario.component.ts
│   │       ├── formulario-usuario.component.html
│   │       └── formulario-usuario.component.scss
│   └── observables/                 # 🔄 LAZY LOADING
│       ├── observables.routes.ts    # Rutas del feature
│       └── componente-reactivo/
├── services/                        # Servicios compartidos
├── models/                          # Modelos
├── pipes/                           # Pipes compartidos
└── directives/                      # Directivas compartidas
```

### Diagrama de Carga

```
┌─────────────────────────────────────────┐
│   BUNDLE INICIAL (main.js) - ~500KB    │
│  ├── App Component                     │
│  ├── Home Component                    │
│  ├── Notificaciones Component          │
│  ├── Header, Footer, Layout            │
│  ├── Router Core                       │
│  └── Services Core                     │
└─────────────────────────────────────────┘
              │
              ├─→ /usuarios → CARGA BAJO DEMANDA
              │   ┌─────────────────────────────┐
              │   │ usuarios-chunk.js - ~300KB  │
              │   │  ├── ListaUsuarios          │
              │   │  ├── DetalleUsuario         │
              │   │  ├── FormularioUsuario      │
              │   │  ├── UsuarioCard            │
              │   │  └── Paginacion             │
              │   └─────────────────────────────┘
              │
              └─→ /observables → CARGA BAJO DEMANDA
                  ┌─────────────────────────────┐
                  │ observables-chunk.js ~150KB │
                  │  └── ComponenteReactivo     │
                  └─────────────────────────────┘
```

---

## 🛠️ Implementación Paso a Paso

### Paso 1: Crear Estructura de Features

#### 1.1 Crear Carpetas

```bash
# En la terminal de VS Code
mkdir src/app/features
mkdir src/app/features/usuarios
mkdir src/app/features/usuarios/lista
mkdir src/app/features/usuarios/detalle
mkdir src/app/features/usuarios/formulario
mkdir src/app/features/observables
```

---

### Paso 2: Reorganizar Feature de Usuarios

#### 2.1 Mover ListaUsuarios

**Mover archivos:**

```
src/app/components/lista-usuarios/
  → src/app/features/usuarios/lista/
```

**Archivos a mover:**

- `lista-usuarios.component.ts` → `lista/lista-usuarios.component.ts`
- `lista-usuarios.component.html` → `lista/lista-usuarios.component.html`
- `lista-usuarios.component.scss` → `lista/lista-usuarios.component.scss`
- `usuario-card/` (carpeta completa) → `lista/usuario-card/`

#### 2.2 Mover DetalleUsuario

**Mover archivos:**

```
src/app/components/detalle-usuario/
  → src/app/features/usuarios/detalle/
```

**Archivos a mover:**

- `detalle-usuario.component.ts` → `detalle/detalle-usuario.component.ts`
- `detalle-usuario.component.html` → `detalle/detalle-usuario.component.html`
- `detalle-usuario.component.scss` → `detalle/detalle-usuario.component.scss`

#### 2.3 Mover AgregarUsuario (Formulario)

**Mover archivos:**

```
src/app/components/agregar-usuario/
  → src/app/features/usuarios/formulario/
```

**Archivos a mover:**

- `agregar-usuario.component.ts` → `formulario/formulario-usuario.component.ts`
- `agregar-usuario.component.html` → `formulario/formulario-usuario.component.html`
- `agregar-usuario.component.scss` → `formulario/formulario-usuario.component.scss`

**⚠️ IMPORTANTE**: Renombra la clase del componente:

```typescript
// ANTES
export class AgregarUsuario { }

// DESPUÉS
export class FormularioUsuario { }
```

---

### Paso 3: Actualizar Imports en Componentes Movidos

Después de mover los archivos, los imports relativos cambiarán.

#### 3.1 Actualizar `lista-usuarios.component.ts`

```typescript
// ANTES (cuando estaba en components/lista-usuarios/)
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';

// DESPUÉS (ahora en features/usuarios/lista/)
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioCardComponent } from './usuario-card/usuario-card.component';
```

#### 3.2 Actualizar `detalle-usuario.component.ts`

```typescript
// DESPUÉS (ahora en features/usuarios/detalle/)
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../models/usuario.model';
import { NotificacionService } from '../../../services/notificacion.service';
```

#### 3.3 Actualizar `formulario-usuario.component.ts`

```typescript
// DESPUÉS (ahora en features/usuarios/formulario/)
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../models/usuario.model';
import { CustomValidatorsService } from '../../../services/custom-validators.service';

// Y cambiar el selector y nombre de clase
@Component({
  selector: 'app-formulario-usuario',  // Cambiar de 'app-agregar-usuario'
  // ...
})
export class FormularioUsuario {  // Cambiar de AgregarUsuario
  // ...
}
```

---

### Paso 4: Crear Rutas del Feature de Usuarios

#### 4.1 Crear `usuarios.routes.ts`

**Ubicación**: `src/app/features/usuarios/usuarios.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lista/lista-usuarios.component').then(
        (m) => m.ListaUsuarios
      ),
  },
  {
    path: 'agregar',
    loadComponent: () =>
      import('./formulario/formulario-usuario.component').then(
        (m) => m.FormularioUsuario
      ),
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./formulario/formulario-usuario.component').then(
        (m) => m.FormularioUsuario
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detalle/detalle-usuario.component').then(
        (m) => m.DetalleUsuario
      ),
  },
];
```

**📝 Explicación:**

- `loadComponent`: Carga el componente dinámicamente
- `import()`: Import dinámico de ES2020
- `.then(m => m.ComponentName)`: Extrae el componente exportado del módulo

**⚠️ NOTA sobre el orden**: La ruta `:id` está al final porque es más genérica. Angular evalúa rutas en orden, así que rutas específicas como `agregar` deben ir primero.

---

### Paso 5: Reorganizar Feature de Observables

#### 5.1 Mover ComponenteReactivo

**Mover archivos:**

```
src/app/components/componente-reactivo/
  → src/app/features/observables/componente-reactivo/
```

#### 5.2 Actualizar Imports

```typescript
// En features/observables/componente-reactivo/componente-reactivo.component.ts
import { ObservablesService } from '../../../services/observables.service';
```

#### 5.3 Crear `observables.routes.ts`

**Ubicación**: `src/app/features/observables/observables.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const OBSERVABLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./componente-reactivo/componente-reactivo.component').then(
        (m) => m.ComponenteReactivo
      ),
  },
];
```

---

### Paso 6: Actualizar Rutas Principales

#### 6.1 Modificar `app.routes.ts`

**Ubicación**: `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { Home } from './components/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'usuarios',
    loadChildren: () =>
      import('./features/usuarios/usuarios.routes').then(
        (m) => m.USUARIOS_ROUTES
      ),
  },
  {
    path: 'agregar-usuario',
    redirectTo: 'usuarios/agregar',
    pathMatch: 'full',
  },
  {
    path: 'editar-usuario/:id',
    redirectTo: 'usuarios/editar/:id',
    pathMatch: 'full',
  },
  {
    path: 'observables',
    loadChildren: () =>
      import('./features/observables/observables.routes').then(
        (m) => m.OBSERVABLES_ROUTES
      ),
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
```

**📝 Explicación:**

- `Home` sigue siendo eager loading (componente pequeño y ruta inicial)
- `loadChildren`: Carga todo el árbol de rutas de un feature
- Redirects para mantener compatibilidad con rutas antiguas

**💡 loadComponent vs loadChildren:**

- `loadComponent`: Carga un solo componente
- `loadChildren`: Carga un conjunto de rutas (recomendado para features)

---

### Paso 7: Actualizar Navegación en Home

El componente Home navega a rutas que han cambiado.

#### 7.1 Actualizar `home.component.ts`

```typescript
// ANTES
navegarAUsuarios(): void {
  this.router.navigate(['/usuarios']);  // ✅ Esto sigue igual
}

navegarAAgregar(): void {
  this.router.navigate(['/agregar-usuario']);  // ❌ Ruta antigua
}

// DESPUÉS
navegarAAgregar(): void {
  this.router.navigate(['/usuarios/agregar']);  // ✅ Nueva ruta
}
```

---

### Paso 8: Actualizar Links en Templates

#### 8.1 Buscar y Reemplazar en Templates

**Links a actualizar:**

| Link Antiguo            | Link Nuevo               |
| ----------------------- | ------------------------ |
| `/agregar-usuario`    | `/usuarios/agregar`    |
| `/editar-usuario/:id` | `/usuarios/editar/:id` |

**Archivos que pueden tener estos links:**

- `src/app/layout/header/header.component.html`
- `src/app/components/home/home.component.html`
- `src/app/features/usuarios/lista/lista-usuarios.component.html`

#### Ejemplo en header

```html
<!-- ANTES -->
<a routerLink="/agregar-usuario">Agregar Usuario</a>

<!-- DESPUÉS -->
<a routerLink="/usuarios/agregar">Agregar Usuario</a>
```

---

### Paso 9: Configurar Preloading Strategy

#### 9.1 Actualizar `app.config.ts`

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { 
  provideRouter, 
  withPreloading, 
  PreloadAllModules  // ← Importar estrategia
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)  // ← Agregar preloading
    ),
    provideHttpClient(),
    provideAnimations()
  ]
};
```

**📝 Explicación:**

- `PreloadAllModules`: Precarga todos los módulos lazy después del load inicial
- Esto mejora la UX al navegar posteriormente
- Alternativas: `NoPreloading`, custom strategy

---

### Paso 10: Limpiar Carpetas Antiguas

Una vez que hayas verificado que todo funciona:

```bash
# Eliminar carpetas vacías
rm -rf src/app/components/lista-usuarios
rm -rf src/app/components/detalle-usuario
rm -rf src/app/components/agregar-usuario
rm -rf src/app/components/componente-reactivo
```

---

## ✅ Verificación de la Implementación

### Checklist de Verificación

- [ ] ✅ Carpeta `features/` creada con subcarpetas
- [ ] ✅ Componentes movidos a sus nuevas ubicaciones
- [ ] ✅ Imports relativos actualizados en todos los archivos movidos
- [ ] ✅ `usuarios.routes.ts` creado con `loadComponent`
- [ ] ✅ `observables.routes.ts` creado con `loadComponent`
- [ ] ✅ `app.routes.ts` actualizado con `loadChildren`
- [ ] ✅ Redirects configurados para rutas antiguas
- [ ] ✅ `PreloadAllModules` configurado en `app.config.ts`
- [ ] ✅ Links actualizados en templates
- [ ] ✅ Navegación programática actualizada

---

## 🧪 Pruebas

### Paso 11: Probar la Aplicación

#### 11.1 Iniciar el servidor de desarrollo

```bash
ng serve
```

#### 11.2 Abrir la aplicación

Navega a `http://localhost:4200`

#### 11.3 Pruebas Funcionales

**✅ Lista de verificación:**

1. **Ruta inicial (`/`)**

   - [ ] La aplicación carga correctamente
   - [ ] El componente Home se muestra
   - [ ] Los botones "Ver Usuarios" y "Agregar Usuario" funcionan
2. **Navegación a usuarios (`/usuarios`)**

   - [ ] La lista de usuarios se carga correctamente
   - [ ] Los cards de usuario se muestran
   - [ ] La paginación funciona
   - [ ] El filtrado funciona
3. **Detalle de usuario (`/usuarios/:id`)**

   - [ ] Al hacer clic en un usuario, navega al detalle
   - [ ] La información del usuario se muestra
   - [ ] El botón "Editar" funciona
4. **Formulario (`/usuarios/agregar`)**

   - [ ] El formulario de agregar usuario se carga
   - [ ] Las validaciones funcionan
   - [ ] Se puede crear un usuario nuevo
5. **Formulario de edición (`/usuarios/editar/:id`)**

   - [ ] El formulario se carga con datos del usuario
   - [ ] Se puede editar un usuario existente
6. **Observables (`/observables`)**

   - [ ] La ruta de observables carga correctamente
7. **Redirects**

   - [ ] `/agregar-usuario` redirige a `/usuarios/agregar`
   - [ ] `/editar-usuario/1` redirige a `/usuarios/editar/1`

---

## 🔍 Análisis de Bundles

### Paso 12: Compilar en Producción

```bash
ng build --configuration production
```

### Paso 13: Analizar Tamaño de Bundles

Después del build, observa la salida:

```
Initial Chunk Files               | Names              | Raw Size
main-ABCD1234.js                  | main               | 245.67 kB
polyfills-EFGH5678.js             | polyfills          | 82.45 kB
styles-IJKL9012.css               | styles             | 15.32 kB

Lazy Chunk Files                  | Names              | Raw Size
chunk-MNOP3456.js                 | usuarios-routes    | 187.23 kB
chunk-QRST7890.js                 | observables-routes | 45.78 kB

Build at: 2026-02-17T10:30:00.000Z
```

**📊 Comparación:**

| Métrica                         | Sin Lazy Loading | Con Lazy Loading |
| -------------------------------- | ---------------- | ---------------- |
| **Bundle Inicial**         | ~500 KB          | ~245 KB          |
| **Time to Interactive**    | ~3.2s            | ~1.8s            |
| **First Contentful Paint** | ~2.5s            | ~1.2s            |

**✅ Resultado esperado:**

- El bundle inicial (`main.js`) debe ser ~50% más pequeño
- Deben aparecer chunks lazy separados para usuarios y observables

---

### Paso 14: Análisis Visual con webpack-bundle-analyzer

#### 14.1 Build con estadísticas

```bash
ng build --configuration production --stats-json
```

#### 14.2 Instalar analyzer

```bash
npm install -g webpack-bundle-analyzer
```

#### 14.3 Analizar

```bash
webpack-bundle-analyzer dist/gestion-usuarios-app/browser/stats.json
```

Se abrirá una visualización interactiva mostrando:

- Tamaño de cada módulo
- Composición de bundles
- Código duplicado

---

## 🔧 Verificación en Chrome DevTools

### Paso 15: Verificar Carga de Chunks

#### 15.1 Abrir DevTools

- Presiona `F12`
- Ve a la pestaña **Network**

#### 15.2 Filtrar por JS

- Filtra por tipo: `JS`

#### 15.3 Navegar y Observar

1. **Recarga la página** (`Ctrl + R`)

   - Deberías ver solo `main.js`, `polyfills.js`, `styles.css`
2. **Navega a /usuarios**

   - Deberías ver un nuevo chunk cargándose: `chunk-XXXX.js` (usuarios)
3. **Navega a /observables**

   - Deberías ver otro chunk: `chunk-YYYY.js` (observables)

**✅ Éxito**: Si ves los chunks cargándose bajo demanda, ¡lazy loading está funcionando!

---

## 🚀 Optimizaciones Adicionales (Opcional)

### Opción 1: Estrategia Selectiva de Preloading

Crea una estrategia que precargue solo features importantes:

#### Crear `selective-preload.strategy.ts`

**Ubicación**: `src/app/core/selective-preload.strategy.ts`

```typescript
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Precarga solo si la ruta tiene data.preload = true
    if (route.data && route.data['preload']) {
      console.log('Preloading:', route.path);
      return load();
    }
    return of(null);
  }
}
```

#### Actualizar `app.config.ts`

```typescript
import { SelectivePreloadingStrategy } from './core/selective-preload.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(SelectivePreloadingStrategy)  // ← Cambiar estrategia
    ),
    // ...
  ]
};
```

#### Marcar rutas para preload

```typescript
// app.routes.ts
{
  path: 'usuarios',
  loadChildren: () => import('./features/usuarios/usuarios.routes')
    .then((m) => m.USUARIOS_ROUTES),
  data: { preload: true }  // ← Esta ruta se precargará
},
{
  path: 'observables',
  loadChildren: () => import('./features/observables/observables.routes')
    .then((m) => m.OBSERVABLES_ROUTES),
  // Sin data.preload → No se precarga, solo bajo demanda
}
```

---

### Opción 2: Nombres Descriptivos para Chunks

Mejora el debugging asignando nombres a los chunks:

```typescript
// usuarios.routes.ts
export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        /* webpackChunkName: "usuarios-lista" */
        './lista/lista-usuarios.component'
      ).then((m) => m.ListaUsuarios),
  },
  {
    path: 'agregar',
    loadComponent: () =>
      import(
        /* webpackChunkName: "usuarios-formulario" */
        './formulario/formulario-usuario.component'
      ).then((m) => m.FormularioUsuario),
  },
];
```

**Resultado**: Los chunks tendrán nombres como `usuarios-lista-XXXX.js` en lugar de `chunk-XXXX.js`

---

### Opción 3: Route Guards con Lazy Loading

Si tienes guards, también pueden ser lazy:

```typescript
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.routes'),
  canActivate: [
    () => inject(AuthService).isAuthenticated()
  ]
}
```

---

## 📚 Conceptos Clave Aprendidos

### 1. **loadComponent vs loadChildren**

| Feature              | loadComponent                        | loadChildren                        |
| -------------------- | ------------------------------------ | ----------------------------------- |
| **Uso**        | Carga un componente standalone       | Carga un conjunto de rutas          |
| **Sintaxis**   | `loadComponent: () => import(...)` | `loadChildren: () => import(...)` |
| **Retorno**    | Componente                           | Array de Routes                     |
| **Ideal para** | Rutas simples de un solo componente  | Features completos con sub-rutas    |

### 2. **Import Dinámico**

```typescript
// ❌ Import estático (eager loading)
import { MiComponente } from './mi-componente';

// ✅ Import dinámico (lazy loading)
const m�dulo = await import('./mi-componente');
```

### 3. **Preloading Strategies**

| Estrategia            | Comportamiento                          | Cuándo usar                      |
| --------------------- | --------------------------------------- | --------------------------------- |
| `NoPreloading`      | No precarga nada                        | Conexiones lentas                 |
| `PreloadAllModules` | Precarga todo después del initial load | Redes rápidas, app mediana       |
| Custom Strategy       | Precarga selectivamente                 | Fino control sobre qué precargar |

### 4. **Arquitectura de Features**

```
app/
├── core/           → Servicios singleton
├── shared/         → Componentes/pipes reutilizables
├── features/       → Features lazy loaded
│   ├── usuarios/
│   └── admin/
└── components/     → Componentes eager (home, nav, etc.)
```

---

## ✅ Resumen Final

### Lo que has implementado

✅ **Lazy loading** para features de usuarios y observables
✅ **Arquitectura modular** con carpeta `features/`
✅ **Rutas optimizadas** con `loadComponent` y `loadChildren`
✅ **Preloading strategy** para mejorar UX
✅ **Redirects** para compatibilidad con rutas antiguas
✅ **Análisis de bundles** para verificar optimización

### Beneficios obtenidos

📈 **~50% reducción** en bundle inicial
⚡ **~40% mejora** en Time to Interactive
🚀 **Mejor performance** general de la aplicación
🏗️ **Código más organizado** y mantenible
