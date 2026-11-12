
[[_TOC_]]

# ✅ Refactorización del componente `ListaUsuarios` en un componente anidado

---

## 📋 Resumen de Cambios

Se ha refactorizado exitosamente el componente `ListaUsuarios` extrayendo la visualización del card de usuario en un componente anidado independiente llamado `UsuarioCardComponent`.

---

## 🗂️ Estructura de Archivos Creada

```txt
src/app/components/lista-usuarios/
├── usuario-card/                      ← NUEVO
│   ├── usuario-card.component.ts      ← NUEVO
│   ├── usuario-card.component.html    ← NUEVO
│   └── usuario-card.component.scss    ← NUEVO
├── lista-usuarios.component.ts        ← MODIFICADO
├── lista-usuarios.component.html      ← MODIFICADO
├── lista-usuarios.component.scss      ← MODIFICADO
└── [otros archivos sin cambios]
```

---

# usuario-card.component.html

### Cambio 1: Nuevo componente `UsuarioCardComponent`

**Por qué:** Parte de la template del padre, pasa a ser la template del componente anidado

****Antes:****

```txt

```

****Después:****

```txt
<div
  class="usuario-card"
  [appResaltarIdPar]="usuario.id"
  (click)="onCardClick()">

  <div class="card-header">
    <img alt="Avatar del usuario"
      [src]="usuario.avatar"
      [alt]="usuario.name"
      class="avatar"
      (error)="onImageError($event)">
    <div class="usuario-info">
      <h3 class="usuario-nombre">{{ usuario.name | nombreCompleto }}</h3>
      <p class="usuario-username">@{{ usuario.username | uppercase }}</p>
    </div>
    <div class="usuario-id">ID: {{ usuario.id }}</div>
  </div>

  <div class="card-content">
    <div class="info-item">
      <i class="icon-mail"></i>
      <span>{{ usuario.email }}</span>
    </div>
    <div class="info-item">
      <i class="icon-phone"></i>
      <span>{{ usuario.phone }}</span>
    </div>
    @if (usuario.website) {
    <div class="info-item">
      <i class="icon-globe"></i>
      <span>{{ usuario.website }}</span>
    </div>
    }
  </div>

  <div class="card-actions">
    <button
      class="btn btn-outline"
      (click)="onVerDetalles($event)">
      <i class="icon-eye"></i>
      Ver Detalles
    </button>
    <button
      class="btn btn-danger"
      (click)="onEliminar($event)">
      <i class="icon-trash"></i>
      Eliminar
    </button>
  </div>
</div>

```

# usuario-card.component.ts

### Cambio 1: Nuevo componente `UsuarioCardComponent`

**Por qué:** Refactorización para que la funcionalidad que antes estaba en un componente padre, esté en este componente anidado.

****Antes:****

```ts

```

****Después:****

```ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../models/usuario.model';
import { NombreCompletoPipe } from '../../../pipes/nombre-completo.pipe';
import { ResaltarIdParDirective } from '../../../directives/resaltar-id-par.directive';

@Component({
  selector: 'app-usuario-card',
  standalone: true,
  imports: [CommonModule, NombreCompletoPipe, ResaltarIdParDirective],
  templateUrl: './usuario-card.component.html',
  styleUrl: './usuario-card.component.scss',
})
export class UsuarioCardComponent {
  @Input() usuario!: Usuario;

  @Output() verDetalles = new EventEmitter<number>();
  @Output() eliminar = new EventEmitter<{ id: number; nombre: string }>();

  onVerDetalles(event: Event): void {
    event.stopPropagation();
    this.verDetalles.emit(this.usuario.id);
  }

  onEliminar(event: Event): void {
    event.stopPropagation();
    this.eliminar.emit({
      id: this.usuario.id,
      nombre: this.usuario.name,
    });
  }

  onCardClick(): void {
    this.verDetalles.emit(this.usuario.id);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/60?text=No+Image';
  }
}

```

# usuario-card.component.scss

### Cambio 1: Nuevo componente `UsuarioCardComponent`

**Por qué:** El nuevo componente necesita ajustar sus estilos para mantener el look and feel de la aplicación.

****Antes:****

```css

```

****Después:****

```css
// Estilos del componente Usuario Card (anidado en ListaUsuarios)

.usuario-card {
  background: var(--blanco);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--separador-gris);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: var(--naranja-principal);
  }

  .card-header {
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--gris-muy-claro) 0%, var(--blanco) 100%);
    border-bottom: 1px solid var(--separador-gris);
    position: relative;

    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--naranja-principal);
      margin-bottom: 1rem;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .usuario-info {
      text-align: center;

      .usuario-nombre {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--gris-oscuro);
        margin: 0 0 0.25rem 0;
      }

      .usuario-username {
        font-size: 0.8rem;
        color: var(--gris-medio);
        font-weight: 500;
        margin: 0;
      }
    }

    .usuario-id {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: var(--naranja-principal);
      color: var(--blanco);
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }
  }

  .card-content {
    padding: 1.5rem;

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;

      &:last-child {
        margin-bottom: 0;
      }

      i {
        color: var(--naranja-principal);
        font-size: 1rem;
        width: 16px;
        text-align: center;
      }

      span {
        color: var(--gris-oscuro);
        font-size: 0.9rem;
      }
    }
  }

  .card-actions {
    padding: 1rem 1.5rem;
    background-color: var(--gris-muy-claro);
    border-top: 1px solid var(--separador-gris);
    display: flex;
    gap: 0.75rem;

    .btn {
      flex: 1;
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      justify-content: center;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .usuario-card {
    .card-header {
      padding: 1rem;

      .avatar {
        width: 50px;
        height: 50px;
      }

      .usuario-nombre {
        font-size: 1rem;
      }

      .usuario-id {
        padding: 0.2rem 0.4rem;
        font-size: 0.65rem;
      }
    }

    .card-content {
      padding: 1rem;

      .info-item {
        font-size: 0.85rem;

        i {
          font-size: 0.9rem;
        }
      }
    }

    .card-actions {
      padding: 0.75rem 1rem;
      gap: 0.5rem;

      .btn {
        padding: 0.4rem 0.75rem;
        font-size: 0.7rem;
      }
    }
  }
}

```

# lista-usuarios.component.html

### Cambio 1: Modificación del template

**Por qué:** Modificamos la template, puesto que ahora parte de esta template pasará a ser la template del componente anidado.

****Antes:****

```txt
<div
  class="usuario-card"
  [appResaltarIdPar]="usuario.id"
  (click)="verDetalleUsuario(usuario.id)">

  <div class="card-header">
    <img alt="Cabecera del header"
      [src]="usuario.avatar"
      [alt]="usuario.name"
      class="avatar"
      (error)="onImageError($event)">
    <div class="usuario-info">
      <h3 class="usuario-nombre">{{ usuario.name | nombreCompleto }}</h3>
      <p class="usuario-username">@{{ usuario.username | uppercase }}</p>
    </div>
    <div class="usuario-id">ID: {{ usuario.id }}</div>
  </div>

  <div class="card-content">
    <div class="info-item">
      <i class="icon-mail"></i>
      <span>{{ usuario.email }}</span>
    </div>
    <div class="info-item">
      <i class="icon-phone"></i>
      <span>{{ usuario.phone }}</span>
    </div>
    @if (usuario.website) {
    <div class="info-item">
      <i class="icon-globe"></i>
      <span>{{ usuario.website }}</span>
    </div>
    }
  </div>

  <div class="card-actions">
    <button
      class="btn btn-outline"
      (click)="verDetalleUsuario(usuario.id); $event.stopPropagation()">
      <i class="icon-eye"></i>
      Ver Detalles
    </button>
    <button
      class="btn btn-danger"
      (click)="eliminarUsuario(usuario.id, usuario.name); $event.stopPropagation()">
      <i class="icon-trash"></i>
      Eliminar
    </button>
  </div>
</div>
```

****Después:****

```txt
<app-usuario-card
  [usuario]="usuario"
  (verDetalles)="verDetalleUsuario($event)"
  (eliminar)="onEliminarCard($event)">
</app-usuario-card>
```

# lista-usuarios.component.ts

### Cambio 1: Modificación del código

**Por qué:** Eliminamos referencias no necesarias y añadimos la referencia al nuevo componente anidado.

****Antes:****

```ts
import { Component, OnInit, inject, signal, effect, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { PaginacionService } from '../../services/paginacion.service';
import { LoggerService } from '../../services/logger.service';
import { Usuario } from '../../models/usuario.model';
import { NombreCompletoPipe } from '../../pipes/nombre-completo.pipe';
import { ResaltarIdParDirective } from '../../directives/resaltar-id-par.directive';
import { Paginacion } from '../paginacion/paginacion.component';
import { AppError } from '../../models/app-error.model';
import { environment } from '../../../environments/environment';
```

****Después:****

```ts
import { Component, OnInit, inject, signal, effect, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { PaginacionService } from '../../services/paginacion.service';
import { LoggerService } from '../../services/logger.service';
import { Usuario } from '../../models/usuario.model';
import { Paginacion } from '../paginacion/paginacion.component';
import { UsuarioCardComponent } from './usuario-card/usuario-card.component';
import { AppError } from '../../models/app-error.model';
import { environment } from '../../../environments/environment';
```

### Cambio 2: Modificación del código

**Por qué:** Eliminamos los import que ahora no son necesarios en este componente, porque estarán importados en el componente anidado.

****Antes:****

```ts
imports: [
  ReactiveFormsModule,
  FormsModule,
  UpperCasePipe,
  NombreCompletoPipe,
  ResaltarIdParDirective,
  Paginacion,
],
```

****Después:****

```ts
imports: [
  ReactiveFormsModule,
  FormsModule,
  Paginacion,
  UsuarioCardComponent,
],
```

### Cambio 3: Modificación del código

**Por qué:** Añadimos el evento de eliminar un usuario que ahora es un componente anidado

****Antes:****

```ts

```

****Después:****

```ts
onEliminarCard(usuarioData: { id: number; nombre: string }): void {
  this.eliminarUsuario(usuarioData.id, usuarioData.nombre);
}
```

# lista-usuarios.component.scss

### Cambio 1: Cambiamos los estilos

**Por qué:** El cambio de template implica un cambio en los estilos para mantener el look and feel

****Antes:****

```css
// Estilos del componente Lista de Usuarios
.lista-usuarios-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

// Sección del header
.header-section {
  margin-bottom: 2rem;

  .page-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--gris-oscuro);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;

    i {
      font-size: 2.5rem;
      color: var(--naranja-principal);
    }
  }

  .search-section {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;

    .filtro-container {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input-container {
      position: relative;
      flex: 1;
      min-width: 250px;

      .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 3rem;
        border: 2px solid var(--borde-gris);
        border-radius: 25px;
        font-size: 0.9rem;
        background-color: var(--blanco);
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: var(--naranja-principal);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }

        &::placeholder {
          color: var(--gris-claro);
        }
      }

      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--gris-claro);
        font-size: 1rem;
      }
    }

    .filtro-select {
      padding: 0.75rem 1rem;
      border: 2px solid var(--borde-gris);
      border-radius: 25px;
      font-size: 0.9rem;
      background-color: var(--blanco);
      transition: all 0.3s ease;
      cursor: pointer;
      min-width: 180px;

      &:focus {
        outline: none;
        border-color: var(--naranja-principal);
        box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
      }

      &:hover {
        border-color: var(--naranja-hover);
      }
    }
  }
}

// Grid de usuarios
.usuarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  .usuario-card {
    background: var(--blanco);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid var(--separador-gris);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-color: var(--naranja-principal);
    }

    .card-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--gris-muy-claro) 0%, var(--blanco) 100%);
      border-bottom: 1px solid var(--separador-gris);
      position: relative;

      .avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--naranja-principal);
        margin-bottom: 1rem;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }

      .usuario-info {
        text-align: center;

        .usuario-nombre {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--gris-oscuro);
          margin: 0 0 0.25rem 0;
        }

        .usuario-username {
          font-size: 0.8rem;
          color: var(--gris-medio);
          font-weight: 500;
          margin: 0;
        }
      }

      .usuario-id {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--naranja-principal);
        color: var(--blanco);
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
      }
    }

    .card-content {
      padding: 1.5rem;

      .info-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;

        &:last-child {
          margin-bottom: 0;
        }

        i {
          color: var(--naranja-principal);
          font-size: 1rem;
          width: 16px;
          text-align: center;
        }

        span {
          color: var(--gris-oscuro);
          font-size: 0.9rem;
        }
      }
    }

    .card-actions {
      padding: 1rem 1.5rem;
      background-color: var(--gris-muy-claro);
      border-top: 1px solid var(--separador-gris);
      display: flex;
      gap: 0.75rem;

      .btn {
        flex: 1;
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
        justify-content: center;
      }
    }
  }
}

// Estados especiales
.empty-state, .loading-state {
  background: var(--blanco);
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .empty-icon {
    font-size: 4rem;
    color: var(--gris-claro);
    margin-bottom: 1.5rem;
  }

  h3 {
    color: var(--gris-oscuro);
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    color: var(--gris-medio);
    margin-bottom: 2rem;
    line-height: 1.6;
  }
}

// Modal de confirmación
.modal {
  .modal-content {
    .warning-text {
      background-color: var(--naranja-muy-claro);
      padding: 0.75rem;
      border-radius: 6px;
      border-left: 4px solid var(--rojo-peligro);
      margin-top: 1rem;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .lista-usuarios-container {
    padding: 0 0.5rem;
  }

  .header-section {
    .page-title {
      font-size: 2rem;
      margin-bottom: 1rem;

      i {
        font-size: 2rem;
      }
    }

    .search-section {
      flex-direction: column;
      align-items: stretch;

      .search-input-container {
        min-width: auto;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  }

  .usuarios-grid {
    grid-template-columns: 1fr;
    gap: 1rem;

    .usuario-card {
      .card-header {
        padding: 1rem;

        .avatar {
          width: 50px;
          height: 50px;
        }

        .usuario-nombre {
          font-size: 1rem;
        }
      }

      .card-content {
        padding: 1rem;

        .info-item {
          margin-bottom: 0.5rem;

          span {
            font-size: 0.8rem;
          }
        }
      }

      .card-actions {
        padding: 0.75rem 1rem;
        flex-direction: column;

        .btn {
          width: 100%;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .usuarios-grid {
    .usuario-card {
      .card-actions {
        .btn {
          padding: 0.5rem;
          font-size: 0.75rem;
        }
      }
    }
  }
}

```

****Después:****

```css
// Estilos del componente Lista de Usuarios
.lista-usuarios-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

// Sección del header
.header-section {
  margin-bottom: 2rem;

  .page-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--gris-oscuro);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;

    i {
      font-size: 2.5rem;
      color: var(--naranja-principal);
    }
  }

  .search-section {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;

    .filtro-container {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input-container {
      position: relative;
      flex: 1;
      min-width: 250px;

      .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 3rem;
        border: 2px solid var(--borde-gris);
        border-radius: 25px;
        font-size: 0.9rem;
        background-color: var(--blanco);
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: var(--naranja-principal);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }

        &::placeholder {
          color: var(--gris-claro);
        }
      }

      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--gris-claro);
        font-size: 1rem;
      }
    }

    .filtro-select {
      padding: 0.75rem 1rem;
      border: 2px solid var(--borde-gris);
      border-radius: 25px;
      font-size: 0.9rem;
      background-color: var(--blanco);
      transition: all 0.3s ease;
      cursor: pointer;
      min-width: 180px;

      &:focus {
        outline: none;
        border-color: var(--naranja-principal);
        box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
      }

      &:hover {
        border-color: var(--naranja-hover);
      }
    }
  }
}

// Grid de usuarios
.usuarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

// Estados especiales
.empty-state, .loading-state {
  background: var(--blanco);
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .empty-icon {
    font-size: 4rem;
    color: var(--gris-claro);
    margin-bottom: 1.5rem;
  }

  h3 {
    color: var(--gris-oscuro);
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    color: var(--gris-medio);
    margin-bottom: 2rem;
    line-height: 1.6;
  }
}

// Modal de confirmación
.modal {
  .modal-content {
    .warning-text {
      background-color: var(--naranja-muy-claro);
      padding: 0.75rem;
      border-radius: 6px;
      border-left: 4px solid var(--rojo-peligro);
      margin-top: 1rem;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .lista-usuarios-container {
    padding: 0 0.5rem;
  }

  .header-section {
    .page-title {
      font-size: 2rem;
      margin-bottom: 1rem;

      i {
        font-size: 2rem;
      }
    }

    .search-section {
      flex-direction: column;
      align-items: stretch;

      .search-input-container {
        min-width: auto;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  }

  .usuarios-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}


```

---

## ✨ Conceptos Demostrados

Este ejercicio enseña los siguientes conceptos clave de nested components:

### 1. **Comunicación Padre → Hijo (Input)**

```ts
@Input() usuario!: Usuario;
```

El componente hijo recibe datos del padre a través de `@Input`.

### 2. **Comunicación Hijo → Padre (Output)**

```ts
@Output() verDetalles = new EventEmitter<number>();
@Output() eliminar = new EventEmitter<{ id: number; nombre: string }>();
```

El hijo notifica al padre sobre acciones usando `@Output` y `@EventEmitter`.

### 3. **Composición de Componentes**

El padre (`ListaUsuarios`) compone multiples instancias del hijo (`UsuarioCardComponent`) en un bucle `@for`.

### 4. **Separación de Responsabilidades**

- **Padre:** Gestiona estado, lista, paginación, filtros
- **Hijo:** Presenta un usuario y emite eventos de interacción

### 5. **Componentes Standalone**

Ambos componentes son standalone (importan sus dependencias independientemente).

---

## 📚 Aprendizaje Logrado

Al completar esta fase, los estudiantes aprenden:

1. ✅ **Qué es un nested component** - componente dentro de otro
2. ✅ **Cuándo crear nested components** - elementos repetitivos en listas
3. ✅ **Cómo comunicarse padre-hijo** - @Input/@Output y EventEmitter
4. ✅ **Separación de responsabilidades** - cada componente hace una cosa bien
5. ✅ **Improve de testabilidad** - componentes más pequeños son más fáciles de testear
6. ✅ **Reusabilidad** - UsuarioCardComponent podría usarse en otros contextos

---

## Archivos Modificados

```txt
✅ CREADO: src/app/components/lista-usuarios/usuario-card/usuario-card.component.ts
✅ CREADO: src/app/components/lista-usuarios/usuario-card/usuario-card.component.html
✅ CREADO: src/app/components/lista-usuarios/usuario-card/usuario-card.component.scss
✅ MODIFICADO: src/app/components/lista-usuarios/lista-usuarios.component.ts
✅ MODIFICADO: src/app/components/lista-usuarios/lista-usuarios.component.html
✅ MODIFICADO: src/app/components/lista-usuarios/lista-usuarios.component.scss
```

---
