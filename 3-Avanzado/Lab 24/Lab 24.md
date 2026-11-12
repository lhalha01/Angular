
# 🧪 Laboratorio: Migración a Reactive Forms

**Duración estimada**: 2-3 horas
**Nivel**: Intermedio/Avanzado
**Prerrequisitos**: Conocimientos básicos de Angular, TypeScript y Template-Driven Forms

---

## 📋 Objetivos del Laboratorio

Al completar este laboratorio, serás capaz de:

- ✅ Entender las diferencias entre Template-Driven y Reactive Forms
- ✅ Migrar componentes de Template-Driven a Reactive Forms
- ✅ Crear validadores personalizados reutilizables
- ✅ Implementar validación asincrónica
- ✅ Utilizar operadores RxJS para mejorar la UX (debounce, distinctUntilChanged)
- ✅ Aplicar mejores prácticas en formularios reactivos

---

## 🎯 Contexto de la Aplicación

Trabajarás con una aplicación Angular de gestión de usuarios que actualmente utiliza **Template-Driven Forms**. Tu misión es refactorizar los siguientes componentes a **Reactive Forms**:

1. **AgregarUsuario** - Formulario complejo de creación de usuarios
2. **ListaUsuarios** - Búsqueda/filtrado con debounce

---

## 📚 Parte 1: Fundamentos Teóricos

### ¿Por qué Reactive Forms?

| Aspecto                 | Template-Driven       | Reactive Forms    |
| ----------------------- | --------------------- | ----------------- |
| **Definición**   | En el HTML            | En el TypeScript  |
| **Validación**   | Duplicada (HTML + TS) | Centralizada (TS) |
| **Testing**       | Requiere DOM          | Solo lógica      |
| **Reactividad**   | Manual                | Observables       |
| **Escalabilidad** | ❌ Limitada           | ✅ Excelente      |

### Patrón de Migración

```
Template-Driven          →    Reactive Forms
├─ FormsModule           →    ReactiveFormsModule
├─ [(ngModel)]           →    formControlName
├─ #ref="ngForm"         →    [formGroup]="form"
├─ @ViewChild(NgForm)    →    FormGroup property
└─ (input)="method()"    →    valueChanges observable
```

---

## 🛠️ Parte 2: Preparación del Entorno

### Paso 1: Verificar la Aplicación Inicial

Asegúrate de que la aplicación esté funcionando:

```powershell
cd c:\WF\STAFF\gestion-usuarios-app
npm install
npx ng serve
```

Navega a `http://localhost:4200` y verifica:

- ✅ Lista de usuarios se carga
- ✅ Puedes agregar usuarios
- ✅ La búsqueda funciona

---

# agregar-usuario.component.html

### Cambio 1: Reemplaza directiva ngModel por formControlName en inputs de formulario

**Por qué:** La migración de Template-Driven a Reactive Forms requiere cambiar de `[(ngModel)]` a `formControlName`. Esto centraliza la validación y el estado del formulario en la clase TypeScript en lugar de distribuirlo entre el template y el componente, mejorando la testabilidad y permitiendo lógica compleja en el componente de forma más clara.

****Antes:****

```txt
<div class="agregar-usuario-container">
  <div class="header-actions">
    <button class="btn btn-outline" (click)="volver()">
      <i class="icon-arrow-left"></i>
      Volver a la Lista
    </button>
  </div>

  <div class="form-card">
    <div class="card-header">
      <h1 class="page-title">
        <i class="icon-plus"></i>
        Agregar Nuevo Usuario
      </h1>
      <p class="page-subtitle">Complete la información del nuevo usuario</p>
    </div>

    <form class="usuario-form" (ngSubmit)="guardarUsuario()" #formulario="ngForm">

      <!-- Preview del avatar -->
       @if (nuevoUsuario.name) {
      <div class="avatar-preview">
        <img alt="Avatar del usuario"
          [src]="obtenerAvatarPreview()"
          [alt]="nuevoUsuario.name"
          class="avatar">
        <p class="avatar-info">Vista previa del avatar</p>
      </div>
      }

      <!-- Información Personal -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="icon-user"></i>
          Información Personal
        </h3>

        <div class="form-group">
          <label for="name" class="required">Nombre Completo:</label>
          <input
            type="text"
            id="name"
            name="name"
            class="form-control"
            [(ngModel)]="nuevoUsuario.name"
            required
            minlength="3"
            maxlength="100"
            placeholder="Ej: Juan Carlos Pérez"
            #nameInput="ngModel">

          @if (nameInput.invalid && nameInput.touched) {
          <div class="validation-messages">
            @if(nameInput.errors?.['required']) {
            <small class="error-message">
              El nombre completo es obligatorio
            </small>
            }
            @if(nameInput.errors?.['minlength']) {
            <small class="error-message">
              El nombre debe tener al menos 3 caracteres
            </small>
            }
            @if (nameInput.errors?.['maxlength']) {
            <small class="error-message">
              El nombre no puede exceder 100 caracteres
            </small>
            }
          </div>
          }
        </div>

        <div class="form-group">
          <label for="username" class="required">Nombre de Usuario:</label>
          <input
            type="text"
            id="username"
            name="username"
            class="form-control"
            [(ngModel)]="nuevoUsuario.username"
            required
            minlength="3"
            maxlength="20"
            pattern="^[a-zA-Z0-9_]+$"
            placeholder="Ej: juan_perez"
            #usernameInput="ngModel">

          @if (usernameInput.invalid && usernameInput.touched) {
          <div class="validation-messages">
            @if (usernameInput.errors?.['required']) {
            <small class="error-message">
              El nombre de usuario es obligatorio
            </small>
            }
            @if(usernameInput.errors?.['minlength']) {
            <small class="error-message">
              El nombre de usuario debe tener al menos 3 caracteres
            </small>
            }
            @if(usernameInput.errors?.['pattern']) {
            <small class="error-message">
              Solo se permiten letras, números y guiones bajos
            </small>
            }
          </div>
          }
        </div>
      </div>

      <!-- Información de Contacto -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="icon-mail"></i>
          Información de Contacto
        </h3>

        <div class="form-group">
          <label for="email" class="required">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            class="form-control"
            [(ngModel)]="nuevoUsuario.email"
            required
            email
            placeholder="Ej: juan@ejemplo.com"
            #emailInput="ngModel">

          @if (emailInput.invalid && emailInput.touched) {
          <div class="validation-messages">
            @if (emailInput.errors?.['required']) {
            <small class="error-message">
              El email es obligatorio
            </small>
            }
            @if (emailInput.errors?.['email']) {
            <small class="error-message">
              Ingrese un email válido
            </small>
            }
          </div>
          }
          </div>

        <div class="form-group">
          <label for="phone">Teléfono:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            class="form-control"
            [(ngModel)]="nuevoUsuario.phone"
            pattern="^[0-9\-\+\(\)\s]+$"
            placeholder="Ej: +54 11 1234-5678"
            #phoneInput="ngModel">

          @if (phoneInput.invalid && phoneInput.touched) {
          <div class="validation-messages">
            @if (phoneInput.errors?.['pattern']) {
            <small class="error-message">
              Ingrese un formato de teléfono válido
            </small>
            }
          </div>
          }
        </div>

        <div class="form-group">
          <label for="website">Sitio Web:</label>
          <input
            type="url"
            id="website"
            name="website"
            class="form-control"
            [(ngModel)]="nuevoUsuario.website"
            placeholder="Ej: www.ejemplo.com"
            #websiteInput="ngModel">

          @if (websiteInput.invalid && websiteInput.touched) {
          <div class="validation-messages">
            @if (websiteInput.errors?.['url']) {
            <small class="error-message">
              Ingrese una URL válida
            </small>
            }
          </div>
          }
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-outline"
          (click)="limpiarFormularioManual()">
          <i class="icon-x"></i>
          Limpiar
        </button>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="formulario.invalid || guardando"
          [class.loading]="guardando">
          @if (!guardando) {
          <i class="icon-save"></i>
          }
          @if (guardando) {
          <div class="spinner-small"></div>
          }
          {{ guardando ? 'Guardando...' : 'Guardar Usuario' }}
        </button>
      </div>

    </form>
  </div>
</div>

<!-- Modal de éxito -->
@if (mostrarModalExito) {
<div class="modal-overlay" (click)="cerrarModalExito()">
  <div class="modal success-modal" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <div class="success-icon">
        <i class="icon-check-circle"></i>
      </div>
      <h3>¡Usuario Creado!</h3>
    </div>
    <div class="modal-content">
      <p>El usuario <strong>{{ usuarioCreado?.name }}</strong> ha sido creado correctamente.</p>
      <p>ID asignado: <strong>{{ usuarioCreado?.id }}</strong></p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" (click)="crearOtroUsuario()">
        <i class="icon-plus"></i>
        Crear Otro
      </button>
      <button class="btn btn-primary" (click)="verListaUsuarios()">
        <i class="icon-list"></i>
        Ver Lista
      </button>
    </div>
  </div>
</div>
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/agregar-usuario/agregar-usuario.component.html -->

```txt
<div class="agregar-usuario-container">
  <div class="header-actions">
    <button class="btn btn-outline" (click)="volver()">
      <i class="icon-arrow-left"></i>
      Volver a la Lista
    </button>
  </div>

  <div class="form-card">
    <div class="card-header">
      <h1 class="page-title">
        @if (!isEditMode) {
          <i class="icon-plus"></i> Agregar Nuevo Usuario
        }
        @if (isEditMode) {
          <i class="icon-save"></i> Editar Usuario
        }
      </h1>
      <p class="page-subtitle">@if (!isEditMode) {Complete la información del nuevo usuario} @if (isEditMode) {Actualice la información del usuario}</p>
    </div>

    <form [formGroup]="form" (ngSubmit)="guardarUsuario()" class="usuario-form">

      <!-- Preview del avatar -->
       @if (form.get('name')?.value) {
      <div class="avatar-preview">
        <img
          [src]="obtenerAvatarPreview()"
          [alt]="form.get('name')?.value"
          class="avatar">
        <p class="avatar-info">Vista previa del avatar</p>
      </div>
      }

      <!-- Información Personal -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="icon-user"></i>
          Información Personal
        </h3>

        <div class="form-group">
          <label for="name" class="required">Nombre Completo:</label>
          <input
            type="text"
            id="name"
            formControlName="name"
            class="form-control"
            placeholder="Ej: Juan Carlos Pérez">

          @if (form.get('name')?.invalid && form.get('name')?.touched) {
          <div class="validation-messages">
            @if(form.get('name')?.hasError('required')) {
            <small class="error-message">
              El nombre completo es obligatorio
            </small>
            }
            @if(form.get('name')?.hasError('minlength')) {
            <small class="error-message">
              El nombre debe tener al menos 3 caracteres
            </small>
            }
            @if (form.get('name')?.hasError('maxlength')) {
            <small class="error-message">
              El nombre no puede exceder 100 caracteres
            </small>
            }
          </div>
          }
        </div>

        <div class="form-group">
          <label for="username" class="required">Nombre de Usuario:</label>
          <input
            type="text"
            id="username"
            formControlName="username"
            class="form-control"
            placeholder="Ej: juan.perez o juan_perez">

          @if (form.get('username')?.invalid && form.get('username')?.touched) {
          <div class="validation-messages">
            @if (form.get('username')?.hasError('required')) {
            <small class="error-message">
              El nombre de usuario es obligatorio
            </small>
            }
            @if(form.get('username')?.hasError('minlength')) {
            <small class="error-message">
              El nombre de usuario debe tener al menos 3 caracteres
            </small>
            }
            @if(form.get('username')?.hasError('pattern')) {
            <small class="error-message">
              Solo se permiten letras, números, puntos y guiones bajos
            </small>
            }
          </div>
          }
        </div>
      </div>

      <!-- Información de Contacto -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="icon-mail"></i>
          Información de Contacto
        </h3>

        <div class="form-group">
          <label for="email" class="required">Email:</label>
          <input
            type="email"
            id="email"
            formControlName="email"
            class="form-control"
            placeholder="Ej: juan@ejemplo.com">

          @if (form.get('email')?.invalid && form.get('email')?.touched) {
          <div class="validation-messages">
            @if (form.get('email')?.hasError('required')) {
            <small class="error-message">
              El email es obligatorio
            </small>
            }
            @if (form.get('email')?.hasError('email')) {
            <small class="error-message">
              Ingrese un email válido
            </small>
            }
          </div>
          }
          </div>

        <div class="form-group">
          <label for="phone">Teléfono:</label>
          <input
            type="tel"
            id="phone"
            formControlName="phone"
            class="form-control"
            placeholder="Ej: +54 11 1234-5678">

          @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
          <div class="validation-messages">
            @if (form.get('phone')?.hasError('telefonoInvalido')) {
            <small class="error-message">
              Ingrese un formato de teléfono válido
            </small>
            }
          </div>
          }
        </div>

        <div class="form-group">
          <label for="website">Sitio Web:</label>
          <input
            type="url"
            id="website"
            formControlName="website"
            class="form-control"
            placeholder="Ej: https://www.ejemplo.com">

          @if (form.get('website')?.invalid && form.get('website')?.touched) {
          <div class="validation-messages">
            @if (form.get('website')?.hasError('urlInvalida')) {
            <small class="error-message">
              Ingrese una URL válida
            </small>
            }
          </div>
          }
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-outline"
          (click)="limpiarFormularioManual()">
          <i class="icon-x"></i>
          Limpiar
        </button>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="form.invalid || form.pending || guardando"
          [class.loading]="guardando">
          @if (!guardando) {
            <i class="icon-save"></i>
          }
          @if (guardando) {
            <div class="spinner-small"></div>
          }
          {{ guardando ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Guardar Usuario') }}
        </button>
      </div>

    </form>
  </div>
</div>

<!-- Modal de éxito (solo creación) -->
@if (mostrarModalExito && !isEditMode) {
<div class="modal-overlay" (click)="cerrarModalExito()">
  <div class="modal success-modal" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <div class="success-icon">
        <i class="icon-check-circle"></i>
      </div>
      <h3>¡Usuario Creado!</h3>
    </div>
    <div class="modal-content">
      <p>El usuario <strong>{{ usuarioCreado?.name }}</strong> ha sido creado correctamente.</p>
      <p>ID asignado: <strong>{{ usuarioCreado?.id }}</strong></p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" (click)="crearOtroUsuario()">
        <i class="icon-plus"></i>
        Crear Otro
      </button>
      <button class="btn btn-primary" (click)="verListaUsuarios()">
        <i class="icon-list"></i>
        Ver Lista
      </button>
    </div>
  </div>
</div>
}

```

# agregar-usuario.component.ts

### Cambio 1: Migra de FormsModule a ReactiveFormsModule y reemplaza NgForm con FormGroup

**Por qué:** Cambio principal de Template-Driven a Reactive Forms. Se reemplaza `@ViewChild(NgForm)` por un `FormGroup` definido en el constructor con `FormBuilder`. Esto permite validación declarativa, mejor control programático, testing más sencillo sin necesidad de DOM, y facilita validadores personalizados reutilizables.

****Antes:****

```ts
import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { NuevoUsuario, Usuario } from '../../models/usuario.model';
import { AppError } from '../../models/app-error.model';
import { LoggerService } from '../../services/logger.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-agregar-usuario',
  imports: [FormsModule],
  templateUrl: './agregar-usuario.component.html',
  styleUrl: './agregar-usuario.component.scss',
})
export class AgregarUsuario {
  nuevoUsuario: NuevoUsuario = {
    name: '',
    username: '',
    email: '',
    phone: '',
    website: '',
  };

  guardando = false;
  mostrarModalExito = false;
  usuarioCreado: Usuario | null = null;

  @ViewChild('formulario') formulario!: NgForm;

  private usuarioService = inject(UsuarioService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  guardarUsuario(): void {
    // Validar que el formulario sea válido
    if (!this.validarFormulario()) {
      return;
    }

    // Indicar que está guardando
    this.guardando = true;

    // Llamar al servicio para guardar el usuario
    this.usuarioService.agregarUsuario(this.nuevoUsuario).subscribe({
      next: (usuarioCreado:Usuario) => {
        // Guardado exitoso
        this.usuarioCreado = usuarioCreado;
        this.guardando = false;
        this.mostrarModalExito = true;

        // Mostrar notificación de éxito
        this.notificacionService.exito(
          'Usuario Creado',
          `El usuario ${usuarioCreado.name} ha sido agregado correctamente.`,
        );

        // Limpiar el formulario
        this.limpiarFormulario();

        this.logger.info('Usuario creado correctamente:', usuarioCreado);
      },
      error: (error: AppError) => {
        // Error al guardar
        this.logger.error('Error al crear usuario:', error.message);
        this.guardando = false;

        // Mostrar notificación de error
        this.notificacionService.error(
          'Error al crear usuario',
          `Hubo un problema al crear el usuario: ${error.message}. Por favor, inténtelo nuevamente.`,
        );
      },
    });
  }

  private validarFormulario(): boolean {
    // Validaciones básicas
    if (!this.nuevoUsuario.name.trim()) {
      this.notificacionService.advertencia('Campo requerido', 'El nombre es obligatorio');
      return false;
    }

    if (!this.nuevoUsuario.username.trim()) {
      this.notificacionService.advertencia(
        'Campo requerido',
        'El nombre de usuario es obligatorio',
      );
      return false;
    }

    if (!this.nuevoUsuario.email.trim()) {
      this.notificacionService.advertencia('Campo requerido', 'El email es obligatorio');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.nuevoUsuario.email)) {
      this.notificacionService.advertencia('Email inválido', 'Ingrese un email válido');
      return false;
    }

    return true;
  }

  limpiarFormulario(): void {
    this.nuevoUsuario = {
      name: '',
      username: '',
      email: '',
      phone: '',
      website: '',
    };
    this.formulario.resetForm();
  }

  limpiarFormularioManual(): void {
    this.limpiarFormulario();
    this.notificacionService.info(
      'Formulario limpiado',
      'Puede ingresar los datos de un nuevo usuario.',
    );
  }

  obtenerAvatarPreview(): string {
    if (!this.nuevoUsuario.name.trim()) return '';
    const nombreLimpio = encodeURIComponent(this.nuevoUsuario.name.trim());
    const { avatarServiceUrl, avatarConfig } = environment;
    return `${avatarServiceUrl}/?name=${nombreLimpio}&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}&bold=true`;
  }

  volver(): void {
    this.router.navigate(['/usuarios']);
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }

  crearOtroUsuario(): void {
    this.mostrarModalExito = false;
    this.usuarioCreado = null;
    this.limpiarFormulario();
  }

  verListaUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/agregar-usuario/agregar-usuario.component.ts -->

```ts
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { NuevoUsuario, Usuario } from '../../models/usuario.model';
import { AppError } from '../../models/app-error.model';
import { LoggerService } from '../../services/logger.service';
import { CustomValidators } from '../../services/custom-validators.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-agregar-usuario',
  imports: [ReactiveFormsModule],
  templateUrl: './agregar-usuario.component.html',
  styleUrl: './agregar-usuario.component.scss',
})
export class AgregarUsuario implements OnInit {
  form: FormGroup;
  guardando = false;
  mostrarModalExito = false;
  usuarioCreado: Usuario | null = null;
  isEditMode = false;
  usuarioId: number | null = null;

  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);
  private customValidators = inject(CustomValidators);

  constructor() {
    // Crear el formulario reactivo con validadores
    this.form = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern('^[a-zA-Z0-9_.]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', this.customValidators.telefonoValido()],
      website: ['', this.customValidators.urlValida()]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!isNaN(id)) {
      this.isEditMode = true;
      this.usuarioId = id;
      // Cargar usuario y prepopular formulario
      this.usuarioService.obtenerUsuario(id).subscribe({
        next: (usuario: Usuario | undefined) => {
          if (!usuario) {
            this.notificacionService.error('Usuario no encontrado', 'No existe el usuario para editar');
            this.router.navigate(['/usuarios']);
            return;
          }
          this.form.patchValue({
            name: usuario.name,
            username: usuario.username,
            email: usuario.email,
            phone: usuario.phone,
            website: usuario.website,
          });
        },
        error: (err: AppError) => {
          this.notificacionService.error('Error', err.message);
          this.router.navigate(['/usuarios']);
        },
      });
    }
  }

  guardarUsuario(): void {
    // Validar que el formulario sea válido
    if (this.form.invalid) {
      this.notificacionService.advertencia(
        'Formulario inválido',
        'Por favor, complete todos los campos requeridos correctamente'
      );
      // Marcar todos los campos como touched para mostrar errores
      this.form.markAllAsTouched();
      return;
    }

    // Verificar validación asincrónica pendiente
    if (this.form.pending) {
      this.notificacionService.info('Validando...', 'Por favor espere');
      return;
    }

    // Indicar que está guardando
    this.guardando = true;

    // Obtener valores del formulario
    const nuevoUsuario: NuevoUsuario = this.form.getRawValue();

    if (this.isEditMode && this.usuarioId !== null) {
      // Actualizar usuario existente
      this.usuarioService.actualizarUsuario(this.usuarioId, nuevoUsuario).subscribe({
        next: (usuarioActualizado: Usuario) => {
          this.guardando = false;
          this.notificacionService.exito('Usuario actualizado', `Se guardaron los cambios de ${usuarioActualizado.name}.`);
          this.logger.info('Usuario actualizado:', usuarioActualizado);
        },
        error: (error: AppError) => {
          this.logger.error('Error al actualizar usuario:', error.message);
          this.guardando = false;
          this.notificacionService.error('Error al actualizar', `Problema al guardar cambios: ${error.message}`);
        },
      });
    } else {
      // Crear nuevo usuario
      this.usuarioService.agregarUsuario(nuevoUsuario).subscribe({
        next: (usuarioCreado: Usuario) => {
          this.usuarioCreado = usuarioCreado;
          this.guardando = false;
          this.mostrarModalExito = true;
          this.notificacionService.exito('Usuario Creado', `El usuario ${usuarioCreado.name} ha sido agregado correctamente.`);
          this.limpiarFormulario();
          this.logger.info('Usuario creado correctamente:', usuarioCreado);
        },
        error: (error: AppError) => {
          this.logger.error('Error al crear usuario:', error.message);
          this.guardando = false;
          this.notificacionService.error('Error al crear usuario', `Hubo un problema al crear el usuario: ${error.message}. Por favor, inténtelo nuevamente.`);
        },
      });
    }
  }

  limpiarFormulario(): void {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  limpiarFormularioManual(): void {
    this.limpiarFormulario();
    this.notificacionService.info(
      'Formulario limpiado',
      'Puede ingresar los datos de un nuevo usuario.',
    );
  }

  obtenerAvatarPreview(): string {
    const name = this.form.get('name')?.value || '';
    if (!name.trim()) return '';
    const nombreLimpio = encodeURIComponent(name.trim());
    const { avatarServiceUrl, avatarConfig } = environment;
    return `${avatarServiceUrl}/?name=${nombreLimpio}&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}&bold=true`;
  }

  volver(): void {
    this.router.navigate(['/usuarios']);
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }

  crearOtroUsuario(): void {
    this.mostrarModalExito = false;
    this.usuarioCreado = null;
    this.limpiarFormulario();
  }

  verListaUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }
}

```

# componente-reactivo.component.html

### Cambio 1: Agrega atributo title al elemento img para mejorar accesibilidad

**Por qué:** Mejora la experiencia de los usuarios que utilizan pantallas táctiles o necesitan información adicional al pasar el cursor sobre la imagen. El atributo `title` proporciona tooltips con el nombre del usuario, mejorando la accesibilidad (a11y) sin afectar la lógica de Reactive Forms.

****Antes:****

```txt
<img [src]="usuario.avatar" [alt]="usuario.name || 'Avatar de usuario'" class="avatar-small" />
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/componente-reactivo/componente-reactivo.component.html#L31-L31 -->

```txt
<img [src]="usuario.avatar" [alt]="usuario.name || 'Avatar de usuario'" [title]="usuario.name || 'Avatar de usuario'" class="avatar-small" />
```

# detalle-usuario.component.html

### Cambio 1: Añade botones para editar y asignar rol en view de detalles

**Por qué:** Expande las funcionalidades del componente de detalle de usuario, permitiendo navegación directa a edición (mediante la ruta `/editar-usuario/:id`) y gestión de roles. Esto proporciona un UX mejorado consolidando acciones relevantes en un solo lugar en lugar del template anterior que solo permitía eliminar.

****Antes:****

```txt
<div class="detalle-usuario-container">
  <div class="header-actions">
    <button class="btn btn-outline" (click)="volver()">
      <i class="icon-arrow-left"></i>
      Volver a la Lista
    </button>
  </div>

  @if (usuario) {
  <div class="usuario-card" [appResaltarIdPar]="usuario.id">
    <div class="card-header">
      <div class="avatar-section">
        <img alt="Avatar del usuario"
          [src]="usuario.avatar"
          [alt]="usuario.name"
          class="avatar-large"
          (error)="onImageError($event)">
        <div class="usuario-id-badge">ID: {{ usuario.id }}</div>
      </div>

      <div class="usuario-main-info">
        <h1 class="usuario-nombre">{{ usuario.name | nombreCompleto }}</h1>
        <p class="usuario-username">@{{ usuario.username | uppercase }}</p>
        <p class="fecha-registro">Usuario registrado el {{ fechaCreacion | date:'dd/MM/yyyy' }}</p>
      </div>

      <div class="card-actions">
        <button
          class="btn btn-danger"
          (click)="eliminarUsuario()">
          <i class="icon-trash"></i>
          Eliminar Usuario
        </button>
      </div>
    </div>

    <div class="card-content">
      <div class="info-sections">

        <!-- Información de Contacto -->
        <div class="info-section">
          <h3 class="section-title">
            <i class="icon-mail"></i>
            Información de Contacto
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Email:</label>
              <span>{{ usuario.email }}</span>
            </div>
            <div class="info-item">
              <label>Teléfono:</label>
              <span>{{ usuario.phone }}</span>
            </div>
            @if (usuario.website) {
            <div class="info-item">
              <label>Sitio Web:</label>
              <a [href]="'http://' + usuario.website" target="_blank" class="link">
                {{ usuario.website }}
                <i class="icon-external-link"></i>
              </a>
            </div>
            }
          </div>
        </div>

      </div>
    </div>
  </div>
  }

  <!-- Estado de carga -->
  @if (cargando) {
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Cargando información del usuario...</p>
  </div>
  }

  <!-- Estado de error -->
  @if (!usuario && !cargando) {
  <div class="error-state">
    <div class="error-icon">
      <i class="icon-alert-circle"></i>
    </div>
    <h3>Usuario no encontrado</h3>
    <p>El usuario que está buscando no existe o ha sido eliminado.</p>
    <button class="btn btn-primary" (click)="volver()">
      <i class="icon-arrow-left"></i>
      Volver a la Lista
    </button>
  </div>
  }
</div>

<!-- Modal de confirmación para eliminar -->
@if (modalEliminar$ | async; as modalState) {
  @if (modalState.isOpen) {
  <div class="modal-overlay" (click)="cancelarEliminacion()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Confirmar Eliminación</h3>
      </div>
      <div class="modal-content">
        <p>¿Está seguro que desea eliminar al usuario <strong>{{ usuario?.name }}</strong>?</p>
        <p class="warning-text">Esta acción no se puede deshacer y será redirigido a la lista de usuarios.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" (click)="cancelarEliminacion()">Cancelar</button>
        <button class="btn btn-danger" (click)="confirmarEliminacion()">
          <i class="icon-trash"></i>
          Eliminar
        </button>
      </div>
    </div>
  </div>
  }
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/detalle-usuario/detalle-usuario.component.html -->

```txt
<div class="detalle-usuario-container">
  <div class="header-actions">
    <button class="btn btn-outline" (click)="volver()">
      <i class="icon-arrow-left"></i>
      Volver a la Lista
    </button>
  </div>

  @if (usuario) {
  <div class="usuario-card" [appResaltarIdPar]="usuario.id">
    <div class="card-header">
      <div class="avatar-section">
        <img alt="Avatar del usuario"
          [src]="usuario.avatar"
          [alt]="usuario.name"
          class="avatar-large"
          (error)="onImageError($event)">
        <div class="usuario-id-badge">ID: {{ usuario.id }}</div>
      </div>

      <div class="usuario-main-info">
        <h1 class="usuario-nombre">{{ usuario.name | nombreCompleto }}</h1>
        <p class="usuario-username">@{{ usuario.username | uppercase }}</p>
        <p class="fecha-registro">Usuario registrado el {{ fechaCreacion | date:'dd/MM/yyyy' }}</p>
      </div>

      <div class="card-actions actions-inline">
        <button class="btn btn-outline" (click)="abrirAsignarRol()">
          <i class="icon-user"></i>
          Asignar Rol
        </button>
        <button class="btn btn-primary" (click)="editarUsuario()">
          <i class="icon-save"></i>
          Editar Usuario
        </button>
        <button class="btn btn-danger" (click)="eliminarUsuario()">
          <i class="icon-trash"></i>
          Eliminar Usuario
        </button>
      </div>
    </div>

    <div class="card-content">
      <div class="info-sections">

        <!-- Información de Contacto -->
        <div class="info-section">
          <h3 class="section-title">
            <i class="icon-mail"></i>
            Información de Contacto
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Email:</label>
              <span>{{ usuario.email }}</span>
            </div>
            <div class="info-item">
              <label>Teléfono:</label>
              <span>{{ usuario.phone }}</span>
            </div>
            @if (usuario.website) {
            <div class="info-item">
              <label>Sitio Web:</label>
              <a [href]="'http://' + usuario.website" target="_blank" class="link">
                {{ usuario.website }}
                <i class="icon-external-link"></i>
              </a>
            </div>
            }
          </div>
        </div>

      </div>
    </div>
  </div>
  }

  <!-- Estado de carga -->
  @if (cargando) {
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Cargando información del usuario...</p>
  </div>
  }

  <!-- Estado de error -->
  @if (!usuario && !cargando) {
  <div class="error-state">
    <div class="error-icon">
      <i class="icon-alert-circle"></i>
    </div>
    <h3>Usuario no encontrado</h3>
    <p>El usuario que está buscando no existe o ha sido eliminado.</p>
    <button class="btn btn-primary" (click)="volver()">
      <i class="icon-arrow-left"></i>
      Volver a la Lista
    </button>
  </div>
  }
</div>

<!-- Modal de confirmación para eliminar -->
@if (modalEliminar$ | async; as modalState) {
  @if (modalState.isOpen) {
  <div class="modal-overlay" (click)="cancelarEliminacion()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Confirmar Eliminación</h3>
      </div>
      <div class="modal-content">
        <p>¿Está seguro que desea eliminar al usuario <strong>{{ usuario?.name }}</strong>?</p>
        <p class="warning-text">Esta acción no se puede deshacer y será redirigido a la lista de usuarios.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" (click)="cancelarEliminacion()">Cancelar</button>
        <button class="btn btn-danger" (click)="confirmarEliminacion()">
          <i class="icon-trash"></i>
          Eliminar
        </button>
      </div>
    </div>
  </div>
  }
}

<!-- Modal Asignar Rol -->
@if (modalAsignarRol$ | async; as modalRol) {
  @if (modalRol.isOpen) {
  <div class="modal-overlay" (click)="cerrarAsignarRol()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Asignar Rol</h3>
      </div>
      <div class="modal-content">
        <form [formGroup]="asignarRolForm" (ngSubmit)="submitAsignarRol()">
          <div class="form-group">
            <label class="required">Rol</label>
            <input type="text" class="form-control" formControlName="rol" placeholder="Ej: admin, editor">
            <div class="validation-messages">
              @if (asignarRolForm.get('rol')?.touched && asignarRolForm.get('rol')?.errors) {
                @if (asignarRolForm.get('rol')?.errors?.['required']) {
                  <span class="error-message">El rol es obligatorio.</span>
                }
                @if (asignarRolForm.get('rol')?.errors?.['maxlength']) {
                  <span class="error-message">Máximo 50 caracteres.</span>
                }
              }
            </div>
          </div>

          <div class="form-group">
            <label>Comentario</label>
            <textarea class="form-control" rows="3" formControlName="comentario" placeholder="Motivo o referencias"></textarea>
            <div class="validation-messages">
              @if (asignarRolForm.get('comentario')?.touched && asignarRolForm.get('comentario')?.errors?.['maxlength']) {
                <span class="error-message">Máximo 250 caracteres.</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label>Vigencia</label>
            <div class="vigencia-grid">
              <input type="date" class="form-control" formControlName="vigenciaDesde" aria-label="Desde">
              <input type="date" class="form-control" formControlName="vigenciaHasta" aria-label="Hasta">
            </div>
            <div class="validation-messages">
              @if (asignarRolForm.errors?.['rangoFechasInvalido']) {
                <span class="error-message">La fecha Hasta debe ser mayor o igual a Desde.</span>
              }
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="cerrarAsignarRol()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="asignarRolForm.invalid || asignarRolForm.pending">
              <i class="icon-check-circle"></i>
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  }
}

<!-- Edición delegada al componente AgregarUsuario via ruta /editar-usuario/:id -->

```

# detalle-usuario.component.html

### Cambio 2: Actualiza acceso a propiedades de FormGroup en template

**Por qué:** En Reactive Forms, para acceder al valor de un control en el template, se usa `form.get('fieldName')?.value` en lugar de acceso directo a propiedades. Esto refleja que el estado está gestionado por el FormGroup reactivamente, mejorando la seguridad de tipos y facilitando la detección de cambios en Angular.

****Antes:****

```txt
@if (nuevoUsuario.name) {
```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/agregar-usuario/agregar-usuario.component.html#L25-L25 -->

```txt
@if (form.get('name')?.value) {
```

# detalle-usuario.component.scss

### Cambio 1: Mantiene estilos existentes sin cambios específicos a Reactive Forms

**Por qué:** Los estilos SCSS no requieren cambios al migrar a Reactive Forms, ya que el CSS es agnóstico al manejo de estado. Se mantiene la estructura completa para coherencia visual, aunque el comportamiento reactivo ahora viene del FormGroup en lugar de NgForm template-driven.

****Antes:****

```css
// Estilos del componente Agregar Usuario
.agregar-usuario-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

// Acciones del header
.header-actions {
  margin-bottom: 2rem;
}

// Card principal del formulario
.form-card {
  background: var(--blanco);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  
  .card-header {
    padding: 2rem 2rem 1rem;
    background: linear-gradient(135deg, var(--gris-muy-claro) 0%, var(--blanco) 100%);
    border-bottom: 1px solid var(--separador-gris);
    text-align: center;
  
    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--gris-oscuro);
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    
      i {
        color: var(--naranja-principal);
        font-size: 2rem;
      }
    }
  
    .page-subtitle {
      color: var(--gris-medio);
      font-size: 1rem;
      margin: 0;
    }
  }
}

// Formulario de usuario
.usuario-form {
  padding: 2rem;
  
  // Preview del avatar
  .avatar-preview {
    text-align: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--naranja-muy-claro) 0%, var(--blanco) 100%);
    border-radius: 15px;
    border: 2px dashed var(--naranja-principal);
  
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--naranja-principal);
      margin-bottom: 0.75rem;
      display: block;
      margin-left: auto;
      margin-right: auto;
      box-shadow: 0 4px 15px rgba(255, 102, 0, 0.2);
    }
  
    .avatar-info {
      color: var(--gris-medio);
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
    }
  }
  
  // Secciones del formulario
  .form-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background-color: var(--gris-muy-claro);
    border-radius: 12px;
    border-left: 4px solid var(--naranja-principal);
  
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--gris-oscuro);
      margin: 0 0 1.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    
      i {
        color: var(--naranja-principal);
        font-size: 1.1rem;
      }
    }
  
    .form-group {
      margin-bottom: 1.5rem;
    
      &:last-child {
        margin-bottom: 0;
      }
    
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--gris-oscuro);
        font-size: 0.9rem;
      
        &.required::after {
          content: ' *';
          color: var(--rojo-peligro);
        }
      }
    
      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--borde-gris);
        border-radius: 8px;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        background-color: var(--blanco);
      
        &:focus {
          outline: none;
          border-color: var(--naranja-principal);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }
      
        &.ng-invalid.ng-touched {
          border-color: var(--rojo-peligro);
          box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
        }
      
        &.ng-valid.ng-touched {
          border-color: var(--verde-exito);
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }
      
        &::placeholder {
          color: var(--gris-claro);
          font-style: italic;
        }
      }
    
      .validation-messages {
        margin-top: 0.5rem;
      
        .error-message {
          display: block;
          color: var(--rojo-peligro);
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
          padding: 0.25rem 0.5rem;
          background-color: rgba(244, 67, 54, 0.1);
          border-radius: 4px;
          border-left: 3px solid var(--rojo-peligro);
        
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
  
  // Acciones del formulario
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1.5rem;
    border-top: 1px solid var(--separador-gris);
  
    .btn {
      min-width: 140px;
    
      &.loading {
        position: relative;
        color: transparent;
      
        .spinner-small {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }
  }
}

// Modal de éxito
.success-modal {
  .modal-header {
    background: linear-gradient(135deg, var(--verde-exito) 0%, #66BB6A 100%);
    color: var(--blanco);
    text-align: center;
    border-bottom: none;
  
    .success-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      animation: bounce 0.6s ease;
    }
  
    h3 {
      color: var(--blanco);
      margin: 0;
    }
  }
  
  .modal-content {
    text-align: center;
  
    p {
      margin-bottom: 1rem;
    
      strong {
        color: var(--naranja-principal);
      }
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

// Responsive design
@media (max-width: 768px) {
  .agregar-usuario-container {
    padding: 0 0.5rem;
  }
  
  .form-card {
    .card-header {
      padding: 1.5rem 1rem 1rem;
    
      .page-title {
        font-size: 1.5rem;
        flex-direction: column;
        gap: 0.5rem;
      
        i {
          font-size: 1.5rem;
        }
      }
    }
  }
  
  .usuario-form {
    padding: 1.5rem 1rem;
  
    .avatar-preview {
      padding: 1rem;
      margin-bottom: 1.5rem;
    
      .avatar {
        width: 80px;
        height: 80px;
      }
    }
  
    .form-section {
      padding: 1rem;
      margin-bottom: 1.5rem;
    
      .section-title {
        font-size: 1rem;
        margin-bottom: 1rem;
      }
    
      .form-group {
        margin-bottom: 1rem;
      
        .form-control {
          padding: 0.65rem;
        }
      }
    }
  
    .form-actions {
      flex-direction: column;
    
      .btn {
        width: 100%;
        min-width: auto;
      }
    }
  }
}

@media (max-width: 480px) {
  .form-card {
    .card-header {
      padding: 1rem 0.75rem 0.75rem;
    
      .page-title {
        font-size: 1.25rem;
      }
    
      .page-subtitle {
        font-size: 0.9rem;
      }
    }
  }
  
  .usuario-form {
    padding: 1rem 0.75rem;
  
    .avatar-preview {
      .avatar {
        width: 70px;
        height: 70px;
      }
    }
  
    .form-section {
      .form-group {
        .form-control {
          font-size: 0.85rem;
        }
      }
    }
  }
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/agregar-usuario/agregar-usuario.component.scss -->

```css
// Estilos del componente Agregar Usuario
.agregar-usuario-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

// Acciones del header
.header-actions {
  margin-bottom: 2rem;
}

// Card principal del formulario
.form-card {
  background: var(--blanco);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  
  .card-header {
    padding: 2rem 2rem 1rem;
    background: linear-gradient(135deg, var(--gris-muy-claro) 0%, var(--blanco) 100%);
    border-bottom: 1px solid var(--separador-gris);
    text-align: center;
  
    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--gris-oscuro);
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    
      i {
        color: var(--naranja-principal);
        font-size: 2rem;
      }
    }
  
    .page-subtitle {
      color: var(--gris-medio);
      font-size: 1rem;
      margin: 0;
    }
  }
}

// Formulario de usuario
.usuario-form {
  padding: 2rem;
  
  // Preview del avatar
  .avatar-preview {
    text-align: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--naranja-muy-claro) 0%, var(--blanco) 100%);
    border-radius: 15px;
    border: 2px dashed var(--naranja-principal);
  
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--naranja-principal);
      margin-bottom: 0.75rem;
      display: block;
      margin-left: auto;
      margin-right: auto;
      box-shadow: 0 4px 15px rgba(255, 102, 0, 0.2);
    }
  
    .avatar-info {
      color: var(--gris-medio);
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
    }
  }
  
  // Secciones del formulario
  .form-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background-color: var(--gris-muy-claro);
    border-radius: 12px;
    border-left: 4px solid var(--naranja-principal);
  
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--gris-oscuro);
      margin: 0 0 1.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    
      i {
        color: var(--naranja-principal);
        font-size: 1.1rem;
      }
    }
  
    .form-group {
      margin-bottom: 1.5rem;
    
      &:last-child {
        margin-bottom: 0;
      }
    
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--gris-oscuro);
        font-size: 0.9rem;
      
        &.required::after {
          content: ' *';
          color: var(--rojo-peligro);
        }
      }
    
      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--borde-gris);
        border-radius: 8px;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        background-color: var(--blanco);
      
        &:focus {
          outline: none;
          border-color: var(--naranja-principal);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
        }
      
        &.ng-invalid.ng-touched {
          border-color: var(--rojo-peligro);
          box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
        }
      
        &.ng-valid.ng-touched {
          border-color: var(--verde-exito);
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }
      
        &::placeholder {
          color: var(--gris-claro);
          font-style: italic;
        }
      }
    
      .validation-messages {
        margin-top: 0.5rem;
      
        .error-message {
          display: block;
          color: var(--rojo-peligro);
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
          padding: 0.25rem 0.5rem;
          background-color: rgba(244, 67, 54, 0.1);
          border-radius: 4px;
          border-left: 3px solid var(--rojo-peligro);
        
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
  
  // Acciones del formulario
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1.5rem;
    border-top: 1px solid var(--separador-gris);
  
    .btn {
      min-width: 140px;
    
      &.loading {
        position: relative;
        color: transparent;
      
        .spinner-small {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }
  }
}

// Modal de éxito
.success-modal {
  .modal-header {
    background: linear-gradient(135deg, var(--verde-exito) 0%, #66BB6A 100%);
    color: var(--blanco);
    text-align: center;
    border-bottom: none;
  
    .success-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      animation: bounce 0.6s ease;
    }
  
    h3 {
      color: var(--blanco);
      margin: 0;
    }
  }
  
  .modal-content {
    text-align: center;
  
    p {
      margin-bottom: 1rem;
    
      strong {
        color: var(--naranja-principal);
      }
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

// Responsive design
@media (max-width: 768px) {
  .agregar-usuario-container {
    padding: 0 0.5rem;
  }
  
  .form-card {
    .card-header {
      padding: 1.5rem 1rem 1rem;
    
      .page-title {
        font-size: 1.5rem;
        flex-direction: column;
        gap: 0.5rem;
      
        i {
          font-size: 1.5rem;
        }
      }
    }
  }
  
  .usuario-form {
    padding: 1.5rem 1rem;
  
    .avatar-preview {
      padding: 1rem;
      margin-bottom: 1.5rem;
    
      .avatar {
        width: 80px;
        height: 80px;
      }
    }
  
    .form-section {
      padding: 1rem;
      margin-bottom: 1.5rem;
    
      .section-title {
        font-size: 1rem;
        margin-bottom: 1rem;
      }
    
      .form-group {
        margin-bottom: 1rem;
      
        .form-control {
          padding: 0.65rem;
        }
      }
    }
  
    .form-actions {
      flex-direction: column;
    
      .btn {
        width: 100%;
        min-width: auto;
      }
    }
  }
}

@media (max-width: 480px) {
  .form-card {
    .card-header {
      padding: 1rem 0.75rem 0.75rem;
    
      .page-title {
        font-size: 1.25rem;
      }
    
      .page-subtitle {
        font-size: 0.9rem;
      }
    }
  }
  
  .usuario-form {
    padding: 1rem 0.75rem;
  
    .avatar-preview {
      .avatar {
        width: 70px;
        height: 70px;
      }
    }
  
    .form-section {
      .form-group {
        .form-control {
          font-size: 0.85rem;
        }
      }
    }
  }
}

```

# detalle-usuario.component.ts

### Cambio 1: Agrega soporte para edición de usuarios en AgregarUsuario component

**Por qué:** El componente AgregarUsuario ahora implementa OnInit e inyecta ActivatedRoute para detectar si se viene de una ruta de edición (`/editar-usuario/:id`). Si existe `id`, carga el usuario, prepopula el formulario con `patchValue()` y permite actualizar. Esto reutiliza un único componente para crear y editar, reduciendo código duplicado y mejorando mantenibilidad.

****Antes:****

```ts
import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { NuevoUsuario, Usuario } from '../../models/usuario.model';
import { AppError } from '../../models/app-error.model';
import { LoggerService } from '../../services/logger.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-agregar-usuario',
  imports: [FormsModule],
  templateUrl: './agregar-usuario.component.html',
  styleUrl: './agregar-usuario.component.scss',
})
export class AgregarUsuario {
  nuevoUsuario: NuevoUsuario = {
    name: '',
    username: '',
    email: '',
    phone: '',
    website: '',
  };

  guardando = false;
  mostrarModalExito = false;
  usuarioCreado: Usuario | null = null;

  @ViewChild('formulario') formulario!: NgForm;

  private usuarioService = inject(UsuarioService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  guardarUsuario(): void {
    // Validar que el formulario sea válido
    if (!this.validarFormulario()) {
      return;
    }

    // Indicar que está guardando
    this.guardando = true;

    // Llamar al servicio para guardar el usuario
    this.usuarioService.agregarUsuario(this.nuevoUsuario).subscribe({
      next: (usuarioCreado:Usuario) => {
        // Guardado exitoso
        this.usuarioCreado = usuarioCreado;
        this.guardando = false;
        this.mostrarModalExito = true;

        // Mostrar notificación de éxito
        this.notificacionService.exito(
          'Usuario Creado',
          `El usuario ${usuarioCreado.name} ha sido agregado correctamente.`,
        );

        // Limpiar el formulario
        this.limpiarFormulario();

        this.logger.info('Usuario creado correctamente:', usuarioCreado);
      },
      error: (error: AppError) => {
        // Error al guardar
        this.logger.error('Error al crear usuario:', error.message);
        this.guardando = false;

        // Mostrar notificación de error
        this.notificacionService.error(
          'Error al crear usuario',
          `Hubo un problema al crear el usuario: ${error.message}. Por favor, inténtelo nuevamente.`,
        );
      },
    });
  }

  private validarFormulario(): boolean {
    // Validaciones básicas
    if (!this.nuevoUsuario.name.trim()) {
      this.notificacionService.advertencia('Campo requerido', 'El nombre es obligatorio');
      return false;
    }

    if (!this.nuevoUsuario.username.trim()) {
      this.notificacionService.advertencia(
        'Campo requerido',
        'El nombre de usuario es obligatorio',
      );
      return false;
    }

    if (!this.nuevoUsuario.email.trim()) {
      this.notificacionService.advertencia('Campo requerido', 'El email es obligatorio');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.nuevoUsuario.email)) {
      this.notificacionService.advertencia('Email inválido', 'Ingrese un email válido');
      return false;
    }

    return true;
  }

  limpiarFormulario(): void {
    this.nuevoUsuario = {
      name: '',
      username: '',
      email: '',
      phone: '',
      website: '',
    };
    this.formulario.resetForm();
  }

  limpiarFormularioManual(): void {
    this.limpiarFormulario();
    this.notificacionService.info(
      'Formulario limpiado',
      'Puede ingresar los datos de un nuevo usuario.',
    );
  }

  obtenerAvatarPreview(): string {
    if (!this.nuevoUsuario.name.trim()) return '';
    const nombreLimpio = encodeURIComponent(this.nuevoUsuario.name.trim());
    const { avatarServiceUrl, avatarConfig } = environment;
    return `${avatarServiceUrl}/?name=${nombreLimpio}&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}&bold=true`;
  }

  volver(): void {
    this.router.navigate(['/usuarios']);
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }

  crearOtroUsuario(): void {
    this.mostrarModalExito = false;
    this.usuarioCreado = null;
    this.limpiarFormulario();
  }

  verListaUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/agregar-usuario/agregar-usuario.component.ts -->

```ts
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { NotificacionService } from '../../services/notificacion.service';
import { NuevoUsuario, Usuario } from '../../models/usuario.model';
import { AppError } from '../../models/app-error.model';
import { LoggerService } from '../../services/logger.service';
import { CustomValidators } from '../../services/custom-validators.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-agregar-usuario',
  imports: [ReactiveFormsModule],
  templateUrl: './agregar-usuario.component.html',
  styleUrl: './agregar-usuario.component.scss',
})
export class AgregarUsuario implements OnInit {
  form: FormGroup;
  guardando = false;
  mostrarModalExito = false;
  usuarioCreado: Usuario | null = null;
  isEditMode = false;
  usuarioId: number | null = null;

  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);
  private customValidators = inject(CustomValidators);

  constructor() {
    // Crear el formulario reactivo con validadores
    this.form = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern('^[a-zA-Z0-9_.]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', this.customValidators.telefonoValido()],
      website: ['', this.customValidators.urlValida()]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!isNaN(id)) {
      this.isEditMode = true;
      this.usuarioId = id;
      // Cargar usuario y prepopular formulario
      this.usuarioService.obtenerUsuario(id).subscribe({
        next: (usuario: Usuario | undefined) => {
          if (!usuario) {
            this.notificacionService.error('Usuario no encontrado', 'No existe el usuario para editar');
            this.router.navigate(['/usuarios']);
            return;
          }
          this.form.patchValue({
            name: usuario.name,
            username: usuario.username,
            email: usuario.email,
            phone: usuario.phone,
            website: usuario.website,
          });
        },
        error: (err: AppError) => {
          this.notificacionService.error('Error', err.message);
          this.router.navigate(['/usuarios']);
        },
      });
    }
  }

  guardarUsuario(): void {
    // Validar que el formulario sea válido
    if (this.form.invalid) {
      this.notificacionService.advertencia(
        'Formulario inválido',
        'Por favor, complete todos los campos requeridos correctamente'
      );
      // Marcar todos los campos como touched para mostrar errores
      this.form.markAllAsTouched();
      return;
    }

    // Verificar validación asincrónica pendiente
    if (this.form.pending) {
      this.notificacionService.info('Validando...', 'Por favor espere');
      return;
    }

    // Indicar que está guardando
    this.guardando = true;

    // Obtener valores del formulario
    const nuevoUsuario: NuevoUsuario = this.form.getRawValue();

    if (this.isEditMode && this.usuarioId !== null) {
      // Actualizar usuario existente
      this.usuarioService.actualizarUsuario(this.usuarioId, nuevoUsuario).subscribe({
        next: (usuarioActualizado: Usuario) => {
          this.guardando = false;
          this.notificacionService.exito('Usuario actualizado', `Se guardaron los cambios de ${usuarioActualizado.name}.`);
          this.logger.info('Usuario actualizado:', usuarioActualizado);
        },
        error: (error: AppError) => {
          this.logger.error('Error al actualizar usuario:', error.message);
          this.guardando = false;
          this.notificacionService.error('Error al actualizar', `Problema al guardar cambios: ${error.message}`);
        },
      });
    } else {
      // Crear nuevo usuario
      this.usuarioService.agregarUsuario(nuevoUsuario).subscribe({
        next: (usuarioCreado: Usuario) => {
          this.usuarioCreado = usuarioCreado;
          this.guardando = false;
          this.mostrarModalExito = true;
          this.notificacionService.exito('Usuario Creado', `El usuario ${usuarioCreado.name} ha sido agregado correctamente.`);
          this.limpiarFormulario();
          this.logger.info('Usuario creado correctamente:', usuarioCreado);
        },
        error: (error: AppError) => {
          this.logger.error('Error al crear usuario:', error.message);
          this.guardando = false;
          this.notificacionService.error('Error al crear usuario', `Hubo un problema al crear el usuario: ${error.message}. Por favor, inténtelo nuevamente.`);
        },
      });
    }
  }

  limpiarFormulario(): void {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  limpiarFormularioManual(): void {
    this.limpiarFormulario();
    this.notificacionService.info(
      'Formulario limpiado',
      'Puede ingresar los datos de un nuevo usuario.',
    );
  }

  obtenerAvatarPreview(): string {
    const name = this.form.get('name')?.value || '';
    if (!name.trim()) return '';
    const nombreLimpio = encodeURIComponent(name.trim());
    const { avatarServiceUrl, avatarConfig } = environment;
    return `${avatarServiceUrl}/?name=${nombreLimpio}&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}&bold=true`;
  }

  volver(): void {
    this.router.navigate(['/usuarios']);
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }

  crearOtroUsuario(): void {
    this.mostrarModalExito = false;
    this.usuarioCreado = null;
    this.limpiarFormulario();
  }

  verListaUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }
}

```

# lista-usuarios.component.html

### Cambio 1: Migra búsqueda de plantilla reactiva [(ngModel)] a Reactive Forms con dropdown de filtros

**Por qué:** Reemplaza `[(ngModel)]="filtroTexto"` manual por un `FormGroup` (filtroForm) con validación declarativa y control más robusto. Añade dropdown para seleccionar tipo de filtro (nombre, email, todos) permitiendo búsquedas más granulares. Los valores se actualizan reactivamente mediante `valueChanges.pipe(debounceTime, distinctUntilChanged)` en el componente para mejor UX.

****Antes:****

```txt
<div class="lista-usuarios-container">
  <div class="header-section">
    <h1 class="page-title">
      <i class="icon-users"></i>
      Lista de Usuarios
    </h1>

    <div class="search-section">
      <div class="search-input-container">
        <input
          type="text"
          class="search-input"
          placeholder="Buscar por nombre o email..."
          [(ngModel)]="filtroTexto"
          (input)="filtrarUsuarios()">
        <i class="icon-search"></i>
      </div>
      <button
        class="btn btn-primary"
        (click)="navegarAAgregar()">
        <i class="icon-plus"></i>
        Agregar Usuario
      </button>
    </div>
  </div>
</div>
  @if (usuariosPaginados().length > 0) {
  <div class="usuarios-grid">
    @for (usuario of usuariosPaginados(); track usuario.id) {
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
    }
  </div>
  }

  <!-- Paginación -->
  @if (usuariosFiltrados.length > 0) {
  <app-paginacion
    (cambioElementosPorPagina)="onCambioElementosPorPagina($event)">
  </app-paginacion>
  }

  @if (usuariosFiltrados.length === 0 && !cargando()) {
  <div class="empty-state">
    <div class="empty-icon">
      <i class="icon-users"></i>
    </div>
    <h3>No se encontraron usuarios</h3>
    @if (filtroTexto) {
    <p>
      No hay usuarios que coincidan con "{{ filtroTexto }}"
    </p>
    }
    @if (!filtroTexto) {
    <p>
      No hay usuarios registrados en el sistema
    </p>
    }
    <button
      class="btn btn-primary"
      (click)="navegarAAgregar()">
      <i class="icon-plus"></i>
      Agregar Primer Usuario
    </button>
  </div>
  }

  @if (cargando()) {
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Cargando usuarios...</p>
  </div>
  }

<!-- Modal de confirmación para eliminar -->
@if (modalEliminar().isOpen) {
  <div class="modal-overlay" (click)="cancelarEliminacion()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Confirmar Eliminación</h3>
      </div>
      <div class="modal-content">
        <p>¿Está seguro que desea eliminar al usuario <strong>{{ modalEliminar().usuario?.nombre }}</strong>?</p>
        <p class="warning-text">Esta acción no se puede deshacer.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" (click)="cancelarEliminacion()">Cancelar</button>
        <button class="btn btn-danger" (click)="confirmarEliminacion()">
          <i class="icon-trash"></i>
          Eliminar
        </button>
      </div>
    </div>
  </div>
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.html -->

```txt
<div class="lista-usuarios-container">
  <div class="header-section">
    <h1 class="page-title">
      <i class="icon-users"></i>
      Lista de Usuarios
    </h1>

    <div class="search-section">
      <form [formGroup]="filtroForm" (ngSubmit)="$event.preventDefault()" class="filtro-container">
        <div class="search-input-container">
          <input
            type="text"
            formControlName="busqueda"
            class="search-input"
            placeholder="Buscar por nombre o email...">
          <i class="icon-search"></i>
        </div>

        <select
          formControlName="filtrarPor"
          class="filtro-select"
          aria-label="Seleccionar tipo de filtro">
          <option value="todos">Todos los campos</option>
          <option value="nombre">Por Nombre</option>
          <option value="email">Por Email</option>
        </select>

        @if (filtroForm.get('busqueda')?.value) {
          <button type="button" (click)="limpiarBusqueda()" class="btn btn-outline">
            <i class="icon-x"></i>
            Limpiar
          </button>
        }
      </form>

      <button
        class="btn btn-primary"
        (click)="navegarAAgregar()">
        <i class="icon-plus"></i>
        Agregar Usuario
      </button>
    </div>
  </div>
</div>
  @if (usuariosPaginados().length > 0) {
  <div class="usuarios-grid">
    @for (usuario of usuariosPaginados(); track usuario.id) {
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
    }
  </div>
  }

  <!-- Paginación -->
  @if (usuariosFiltrados.length > 0) {
  <app-paginacion
    (cambioElementosPorPagina)="onCambioElementosPorPagina($event)">
  </app-paginacion>
  }

  @if (usuariosFiltrados.length === 0 && !cargando()) {
  <div class="empty-state">
    <div class="empty-icon">
      <i class="icon-users"></i>
    </div>
    <h3>No se encontraron usuarios</h3>
    @if (filtroForm.get('busqueda')?.value) {
    <p>
      No hay usuarios que coincidan con "{{ filtroForm.get('busqueda')?.value }}"
    </p>
    }
    @if (!filtroForm.get('busqueda')?.value) {
    <p>
      No hay usuarios registrados en el sistema
    </p>
    }
    <button
      class="btn btn-primary"
      (click)="navegarAAgregar()">
      <i class="icon-plus"></i>
      Agregar Primer Usuario
    </button>
  </div>
  }

  @if (cargando()) {
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Cargando usuarios...</p>
  </div>
  }

<!-- Modal de confirmación para eliminar -->
@if (modalEliminar().isOpen) {
  <div class="modal-overlay" (click)="cancelarEliminacion()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Confirmar Eliminación</h3>
      </div>
      <div class="modal-content">
        <p>¿Está seguro que desea eliminar al usuario <strong>{{ modalEliminar().usuario?.nombre }}</strong>?</p>
        <p class="warning-text">Esta acción no se puede deshacer.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" (click)="cancelarEliminacion()">Cancelar</button>
        <button class="btn btn-danger" (click)="confirmarEliminacion()">
          <i class="icon-trash"></i>
          Eliminar
        </button>
      </div>
    </div>
  </div>
}

```

# lista-usuarios.component.scss

### Cambio 1: Añade estilos para dropdown de filtros en búsqueda

**Por qué:** Introduce nuevo `.filtro-select` con estilos consistentes con el input de búsqueda (bordes, transiciones, focus states). Mantiene la paleta de colores (naranja secundario) y proporciona feedback visual en hover/focus. El contenedor `.filtro-container` usa flexbox para alinear input y select manteniendo responsiveness en móvil.

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
  
    .search-input-container {
      position: relative;
      flex: 1;
      min-width: 300px;
    
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

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.scss -->

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

# lista-usuarios.component.ts

### Cambio 1: Crea FormGroup para filtros con debounce y validación reactiva

**Por qué:** Reemplaza búsqueda manual por FormGroup con dos controles: `busqueda` y `filtrarPor`. Implementa `valueChanges` con operadores RxJS: `debounceTime(300)` para no filtrar en cada keystroke, `distinctUntilChanged()` para ignorar cambios duplicados, y `takeUntilDestroyed()` para limpiar automáticamente suscripciones al destruir componente. Inyecta `DestroyRef` y usa la nueva función `takeUntilDestroyed()` de Angular 16+ eliminando la necesidad de `OnDestroy` manual.

****Antes:****

```ts
import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
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

interface ModalEliminarState {
  isOpen: boolean;
  usuario?: { id: number; nombre: string };
}

@Component({
  selector: 'app-lista-usuarios',
  imports: [
    FormsModule,
    UpperCasePipe,
    NombreCompletoPipe,
    ResaltarIdParDirective,
    Paginacion,
  ],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss',
})
export class ListaUsuarios implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtroTexto = '';
  cargando = signal(false);

  // Signals que reemplazan los BehaviorSubject
  usuariosPaginados = signal<Usuario[]>([]);
  modalEliminar = signal<ModalEliminarState>({ isOpen: false });

  private usuarioService = inject(UsuarioService);
  private notificacionService = inject(NotificacionService);
  private paginacionService = inject(PaginacionService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  constructor() {
    // Effect que se ejecuta automáticamente cuando cambia la configuración de paginación
    effect(() => {
      this.paginacionService.configuracion();
      this.actualizarUsuariosPaginados();
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    // Acceder directamente al signal sin necesidad de async pipe o suscripción
    const usuarios = this.usuarioService.usuariosProcesados();
    this.usuarios = usuarios;
    this.filtrarUsuarios();
    this.cargando.set(false);
  }

  filtrarUsuarios(): void {
    if (this.filtroTexto.trim()) {
      const filtroLower = this.filtroTexto.toLowerCase();
      this.usuariosFiltrados = this.usuarios.filter(
        (usuario: Usuario) =>
          usuario.name.toLowerCase().includes(filtroLower) ||
          usuario.email.toLowerCase().includes(filtroLower),
      );
    } else {
      this.usuariosFiltrados = [...this.usuarios];
    }

    // Actualizar paginación y reiniciar a la primera página
    this.paginacionService.actualizarConfiguracion(this.usuariosFiltrados.length);
    this.paginacionService.reiniciarPaginacion();
    this.actualizarUsuariosPaginados();
  }

  private actualizarUsuariosPaginados(): void {
    const usuariosPaginados = this.paginacionService.obtenerElementosPaginados(
      this.usuariosFiltrados,
    );
    this.usuariosPaginados.set(usuariosPaginados);
  }

  onCambioElementosPorPagina(nuevoTamano: number): void {
    this.paginacionService.actualizarConfiguracion(this.usuariosFiltrados.length, nuevoTamano);
    this.actualizarUsuariosPaginados();
  }

  verDetalleUsuario(id: number): void {
    this.router.navigate(['/usuarios', id]);
  }

  navegarAAgregar(): void {
    this.router.navigate(['/agregar-usuario']);
  }

  eliminarUsuario(id: number, nombre: string): void {
    this.modalEliminar.set({
      isOpen: true,
      usuario: { id, nombre },
    });
  }

  confirmarEliminacion(): void {
    const modalState = this.modalEliminar();
    if (modalState.usuario) {
      this.usuarioService
        .eliminarUsuario(modalState.usuario.id)
        .subscribe({
          next: (success: boolean) => {
            if (success) {
              this.notificacionService.exito(
                'Usuario eliminado',
                `El usuario ${modalState.usuario!.nombre} ha sido eliminado correctamente.`,
              );

              this.filtrarUsuarios(); // Actualizar la lista filtrada
              this.logger.info('Usuario eliminado correctamente');
            } else {
              this.notificacionService.error(
                'Error al eliminar',
                'No se pudo eliminar el usuario. Por favor, inténtelo nuevamente.',
              );
            }
          },
          error: (error: AppError) => {
            this.logger.error('Error al eliminar usuario:', error.message);
            this.notificacionService.error(
              'Error al eliminar usuario',
              `Hubo un problema al eliminar el usuario: ${error.message}. Por favor, inténtelo nuevamente.`,
            );
          },
        });
    }
    this.cancelarEliminacion();
  }

  cancelarEliminacion(): void {
    this.modalEliminar.set({ isOpen: false });
  }

  onImageError(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLImageElement) {
      const { avatarServiceUrl, avatarConfig } = environment;
      target.src = `${avatarServiceUrl}/?name=Usuario&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}`;
    }
  }
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/components/lista-usuarios/lista-usuarios.component.ts -->

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

interface ModalEliminarState {
  isOpen: boolean;
  usuario?: { id: number; nombre: string };
}

@Component({
  selector: 'app-lista-usuarios',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    UpperCasePipe,
    NombreCompletoPipe,
    ResaltarIdParDirective,
    Paginacion,
  ],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss',
})
export class ListaUsuarios implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtroTexto = '';
  filtroForm: FormGroup;
  cargando = signal(false);

  // Signals que reemplazan los BehaviorSubject
  usuariosPaginados = signal<Usuario[]>([]);
  modalEliminar = signal<ModalEliminarState>({ isOpen: false });

  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private notificacionService = inject(NotificacionService);
  private paginacionService = inject(PaginacionService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Effect que se ejecuta automáticamente cuando cambia la configuración de paginación
    effect(() => {
      this.paginacionService.configuracion();
      this.actualizarUsuariosPaginados();
    });

    // Crear formulario de filtros
    this.filtroForm = this.fb.group({
      busqueda: [''],
      filtrarPor: ['todos'], // 'nombre' | 'email' | 'todos'
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.configurarFiltros();
  }

  private configurarFiltros(): void {
    // Reactividad automática con debounce
    this.filtroForm.valueChanges
      .pipe(
        debounceTime(300), // Espera 300ms sin cambios
        distinctUntilChanged(
          (prev, curr) =>
            prev?.busqueda === curr?.busqueda &&
            prev?.filtrarPor === curr?.filtrarPor,
        ),
        takeUntilDestroyed(this.destroyRef), // Limpieza automática al destruir el componente
      )
      .subscribe(() => {
        this.filtrarUsuarios();
      });
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    // Acceder directamente al signal sin necesidad de async pipe o suscripción
    const usuarios = this.usuarioService.usuariosProcesados();
    this.usuarios = usuarios;
    this.filtrarUsuarios();
    this.cargando.set(false);
  }

  filtrarUsuarios(): void {
    const { busqueda, filtrarPor } = this.filtroForm.value;

    if (!busqueda || !busqueda.trim()) {
      this.usuariosFiltrados = [...this.usuarios];
    } else {
      const filtroLower = busqueda.toLowerCase();

      this.usuariosFiltrados = this.usuarios.filter((usuario: Usuario) => {
        switch (filtrarPor) {
          case 'nombre':
            return usuario.name.toLowerCase().includes(filtroLower);
          case 'email':
            return usuario.email.toLowerCase().includes(filtroLower);
          case 'todos':
          default:
            return (
              usuario.name.toLowerCase().includes(filtroLower) ||
              usuario.email.toLowerCase().includes(filtroLower)
            );
        }
      });
    }

    // Actualizar paginación y reiniciar a la primera página
    this.paginacionService.actualizarConfiguracion(this.usuariosFiltrados.length);
    this.paginacionService.reiniciarPaginacion();
    this.actualizarUsuariosPaginados();
  }

  limpiarBusqueda(): void {
    this.filtroForm.reset({ busqueda: '', filtrarPor: 'todos' });
  }

  private actualizarUsuariosPaginados(): void {
    const usuariosPaginados = this.paginacionService.obtenerElementosPaginados(
      this.usuariosFiltrados,
    );
    this.usuariosPaginados.set(usuariosPaginados);
  }

  onCambioElementosPorPagina(nuevoTamano: number): void {
    this.paginacionService.actualizarConfiguracion(this.usuariosFiltrados.length, nuevoTamano);
    this.actualizarUsuariosPaginados();
  }

  verDetalleUsuario(id: number): void {
    this.router.navigate(['/usuarios', id]);
  }

  navegarAAgregar(): void {
    this.router.navigate(['/agregar-usuario']);
  }

  eliminarUsuario(id: number, nombre: string): void {
    this.modalEliminar.set({
      isOpen: true,
      usuario: { id, nombre },
    });
  }

  confirmarEliminacion(): void {
    const modalState = this.modalEliminar();
    if (modalState.usuario) {
      this.usuarioService.eliminarUsuario(modalState.usuario.id).subscribe({
        next: (success: boolean) => {
          if (success) {
            this.notificacionService.exito(
              'Usuario eliminado',
              `El usuario ${modalState.usuario!.nombre} ha sido eliminado correctamente.`,
            );

            this.filtrarUsuarios(); // Actualizar la lista filtrada
            this.logger.info('Usuario eliminado correctamente');
          } else {
            this.notificacionService.error(
              'Error al eliminar',
              'No se pudo eliminar el usuario. Por favor, inténtelo nuevamente.',
            );
          }
        },
        error: (error: AppError) => {
          this.logger.error('Error al eliminar usuario:', error.message);
          this.notificacionService.error(
            'Error al eliminar usuario',
            `Hubo un problema al eliminar el usuario: ${error.message}. Por favor, inténtelo nuevamente.`,
          );
        },
      });
    }
    this.cancelarEliminacion();
  }

  cancelarEliminacion(): void {
    this.modalEliminar.set({ isOpen: false });
  }

  onImageError(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLImageElement) {
      const { avatarServiceUrl, avatarConfig } = environment;
      target.src = `${avatarServiceUrl}/?name=Usuario&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}`;
    }
  }
}

```

# custom-validators.service.ts

### Cambio 1: Crea nuevo servicio de validadores personalizados para Reactive Forms

**Por qué:** Los validadores personalizados reutilizables son un patrón clave en Reactive Forms. Este servicio proporciona: `telefonoValido()` (sincrónico) que acepta múltiples formatos de teléfono, `urlValida()` (sincrónico) que valida URLs con/sin protocolo, `emailUnico()` (asincrónico) que simula verificación contra base de datos con debounce, y `usuarioUnico()` (asincrónico) similar. Centralizar estos validadores permite reutilización consistente y testing independiente.

Crear nuevo servicio:

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/services/custom-validators.service.ts -->

```ts
import { Injectable } from '@angular/core';
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  AsyncValidatorFn,
} from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomValidators {

  // ===== VALIDADORES SÍNCRONOS =====

  /**
   * Valida que el teléfono tenga formato válido
   * Acepta: +54 11 1234-5678, 1123456789, 1-770-736-8031 x56442, etc.
   */
  telefonoValido(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      // Acepta números, espacios, guiones, paréntesis, +, y extensiones (x o ext seguido de números)
      const regex = /^[0-9\-\+\(\)\s]+(x|ext\.?\s*\d+)?$/i;
      const esValido = regex.test(control.value.trim());

      return esValido ? null : { telefonoInvalido: true };
    };
  }

  /**
   * Valida que la URL sea válida
   * Acepta URLs con o sin protocolo
   */
  urlValida(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const value = control.value.trim();
      if (!value) return null;

      try {
        // Si no tiene protocolo, agregar http:// temporalmente para validar
        const urlToValidate = value.match(/^https?:\/\//) ? value : `http://${value}`;
        new URL(urlToValidate);
        return null;
      } catch {
        return { urlInvalida: true };
      }
    };
  }

  // ===== VALIDADORES ASÍNCRONOS =====

  /**
   * Valida que el email sea único (simulado con delay)
   * En producción, esto llamaría a una API real
   */
  emailUnico(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      // Simular delay de API (500ms)
      return timer(500).pipe(
        switchMap(() => {
          // Simulación: estos emails "ya existen" en el sistema
          const emailsRegistrados = [
            'admin@app.com',
            'user@example.com',
            'test@test.com'
          ];

          const existe = emailsRegistrados.includes(control.value.toLowerCase());
          return existe
            ? of({ emailUnico: true })
            : of(null);
        }),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Valida que el username sea único (simulado con delay)
   * En producción, esto llamaría a una API real
   */
  usuarioUnico(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => {
          // Simulación: estos usernames "ya existen"
          const usuariosRegistrados = [
            'admin',
            'user123',
            'testuser'
          ];

          const existe = usuariosRegistrados.includes(control.value.toLowerCase());
          return existe
            ? of({ usuarioUnico: true })
            : of(null);
        }),
        catchError(() => of(null))
      );
    };
  }
}

```

# usuario.service.ts

### Cambio 1: Agrega método actualizarUsuario() y moderniza inyección de dependencias

**Por qué:** Implementa nuevo método `actualizarUsuario(id, cambios)` necesario para la funcionalidad de edición. Cambia de inyección Constructor a `inject()` (patrón Angular 18+) y actualiza el avatar automáticamente si el nombre cambió. Mantiene en memoria local los cambios y sincroniza los signals `usuarios` y `usuariosProcesados` para reactividad consistente en toda la app.

****Antes:****

```ts
import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Usuario, NuevoUsuario } from '../models/usuario.model';
import { APP_CONSTANTS } from '../constants/app.constants';
import { AppError } from '../models/app-error.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private usuariosMemoria: Usuario[] = [];
  private proximoId = APP_CONSTANTS.NEXT_USER_ID_START; // JSONPlaceholder tiene 10 usuarios

  // Signals que reemplazan los BehaviorSubject
  public usuarios = signal<Usuario[]>([]);
  public usuariosProcesados = signal<Usuario[]>([]);

  // Observable derivado del signal para compatibilidad con componentes educativos
  public usuarios$ = toObservable(this.usuarios);

  constructor(private http: HttpClient) {
    this.cargarUsuarios();
  }

  /**
   * Obtiene todos los usuarios
   */
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl).pipe(
      map((usuarios: Usuario[]) => usuarios.map(usuario => ({
        ...usuario,
        avatar: this.generarAvatar(usuario.name)
      }))),
      tap((usuarios: Usuario[]) => {
        this.usuariosMemoria = [...usuarios];
        this.usuarios.set(this.usuariosMemoria);
        this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));
      }),
      catchError((error: HttpErrorResponse) => {
        const appError: AppError = {
          status: error.status,
          message: error.message || 'Error al obtener usuarios'
        };
        return throwError(() => appError);
      })
    );
  }

  /**
   * Obtiene un usuario por ID
   */
  obtenerUsuario(id: number): Observable<Usuario | undefined> {
    // Primero buscar en memoria
    const usuarioEnMemoria = this.usuariosMemoria.find(u => u.id === id);
    if (usuarioEnMemoria) {
      return of(usuarioEnMemoria);
    }

    // Si no está en memoria, buscar en API
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`).pipe(
      map((usuario: Usuario) => ({
        ...usuario,
        avatar: this.generarAvatar(usuario.name)
      })),
      catchError((error: HttpErrorResponse) => {
        const appError: AppError = {
          status: error.status,
          message: error.message || 'Error al obtener usuario'
        };
        return throwError(() => appError);
      })
    );
  }

  /**
   * Agrega un nuevo usuario
   */
  agregarUsuario(nuevoUsuario: NuevoUsuario): Observable<Usuario> {
    const usuario: Usuario = {
      id: this.proximoId++,
      ...nuevoUsuario,
      address: {
        street: '',
        suite: '',
        city: '',
        zipcode: '',
        geo: { lat: '', lng: '' }
      },
      company: {
        name: '',
        catchPhrase: '',
        bs: ''
      },
      avatar: this.generarAvatar(nuevoUsuario.name)
    };

    // Agregar a memoria local
    this.usuariosMemoria.push(usuario);
    this.usuarios.set([...this.usuariosMemoria]);
    this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));

    // Retornar Observable con el usuario creado
    return of(usuario);
  }

  /**
   * Elimina un usuario
   */
  eliminarUsuario(id: number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => {
        const indice = this.usuariosMemoria.findIndex((u: Usuario) => u.id === id);
        if (indice !== -1) {
          this.usuariosMemoria.splice(indice, 1);
          this.usuarios.set([...this.usuariosMemoria]);
          this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));
          return true;
        }
        return false;
      }),
      catchError((error: HttpErrorResponse) => {
        const appError: AppError = {
          status: error.status,
          message: error.message || 'Error al eliminar usuario'
        };
        return throwError(() => appError);
      })
    );
  }

  /**
   * Genera un avatar usando UI Avatars
   */
  private generarAvatar(nombre: string): string {
    const nombreLimpio = encodeURIComponent(nombre.trim());
    const { avatarServiceUrl, avatarConfig } = environment;
    return `${avatarServiceUrl}/?name=${nombreLimpio}&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}&bold=true`;
  }

  /**
   * Procesa y transforma la lista de usuarios
   */
  private procesarUsuarios(usuarios: Usuario[]): Usuario[] {
    return usuarios.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Carga inicial de usuarios
   */
  private cargarUsuarios(): void {
    this.obtenerUsuarios().subscribe();
  }

  /**
   * Busca usuarios por nombre o email
   */
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const terminoLower = termino.toLowerCase();
    const usuariosFiltrados = this.usuariosMemoria.filter((usuario: Usuario) =>
      usuario.name.toLowerCase().includes(terminoLower) ||
      usuario.email.toLowerCase().includes(terminoLower)
    );
    return of(usuariosFiltrados);
  }
}

```

**Después:**

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/services/usuario.service.ts -->

```ts
import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Usuario, NuevoUsuario } from '../models/usuario.model';
import { APP_CONSTANTS } from '../constants/app.constants';
import { AppError } from '../models/app-error.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private usuariosMemoria: Usuario[] = [];
  private proximoId = APP_CONSTANTS.NEXT_USER_ID_START; // JSONPlaceholder tiene 10 usuarios

  // Signals que reemplazan los BehaviorSubject
  public usuarios = signal<Usuario[]>([]);
  public usuariosProcesados = signal<Usuario[]>([]);

  // Observable derivado del signal para compatibilidad con componentes educativos
  public usuarios$ = toObservable(this.usuarios);

  private http = inject(HttpClient);

  constructor() {
    this.cargarUsuarios();
  }

  /**
   * Obtiene todos los usuarios
   */
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl).pipe(
      map((usuarios: Usuario[]) => usuarios.map(usuario => ({
        ...usuario,
        avatar: this.generarAvatar(usuario.name)
      }))),
      tap((usuarios: Usuario[]) => {
        this.usuariosMemoria = [...usuarios];
        this.usuarios.set(this.usuariosMemoria);
        this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));
      }),
      catchError((error: HttpErrorResponse) => {
        const appError: AppError = {
          status: error.status,
          message: error.message || 'Error al obtener usuarios'
        };
        return throwError(() => appError);
      })
    );
  }

  /**
   * Obtiene un usuario por ID
   */
  obtenerUsuario(id: number): Observable<Usuario | undefined> {
    // Primero buscar en memoria
    const usuarioEnMemoria = this.usuariosMemoria.find(u => u.id === id);
    if (usuarioEnMemoria) {
      return of(usuarioEnMemoria);
    }

    // Si no está en memoria, buscar en API
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`).pipe(
      map((usuario: Usuario) => ({
        ...usuario,
        avatar: this.generarAvatar(usuario.name)
      })),
      catchError((error: HttpErrorResponse) => {
        const appError: AppError = {
          status: error.status,
          message: error.message || 'Error al obtener usuario'
        };
        return throwError(() => appError);
      })
    );
  }

  /**
   * Agrega un nuevo usuario
   */
  agregarUsuario(nuevoUsuario: NuevoUsuario): Observable<Usuario> {
    const usuario: Usuario = {
      id: this.proximoId++,
      ...nuevoUsuario,
      address: {
        street: '',
        suite: '',
        city: '',
        zipcode: '',
        geo: { lat: '', lng: '' }
      },
      company: {
        name: '',
        catchPhrase: '',
        bs: ''
      },
      avatar: this.generarAvatar(nuevoUsuario.name)
    };

    // Agregar a memoria local
    this.usuariosMemoria.push(usuario);
    this.usuarios.set([...this.usuariosMemoria]);
    this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));

    // Retornar Observable con el usuario creado
    return of(usuario);
  }

  /**
   * Elimina un usuario
   */
  eliminarUsuario(id: number): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => {
        const indice = this.usuariosMemoria.findIndex((u: Usuario) => u.id === id);
        if (indice !== -1) {
          this.usuariosMemoria.splice(indice, 1);
          this.usuarios.set([...this.usuariosMemoria]);
          this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));
          return true;
        }
        return false;
      }),
      catchError((error: HttpErrorResponse) => {
        const appError: AppError = {
          status: error.status,
          message: error.message || 'Error al eliminar usuario'
        };
        return throwError(() => appError);
      })
    );
  }

  /**
   * Actualiza un usuario existente (sin asumir backend)
   * Punto de extensión para integración con API real.
   */
  actualizarUsuario(id: number, cambios: Partial<NuevoUsuario>): Observable<Usuario> {
    const indice = this.usuariosMemoria.findIndex((u: Usuario) => u.id === id);
    if (indice === -1) {
      const appError: AppError = { status: 404, message: 'Usuario no encontrado' };
      return throwError(() => appError);
    }

    const actual = this.usuariosMemoria[indice];
    const actualizado: Usuario = {
      ...actual,
      ...cambios,
      avatar: cambios.name ? this.generarAvatar(cambios.name) : actual.avatar,
    };

    this.usuariosMemoria[indice] = actualizado;
    this.usuarios.set([...this.usuariosMemoria]);
    this.usuariosProcesados.set(this.procesarUsuarios(this.usuariosMemoria));

    return of(actualizado);
  }

  /**
   * Genera un avatar usando UI Avatars
   */
  private generarAvatar(nombre: string): string {
    const nombreLimpio = encodeURIComponent(nombre.trim());
    const { avatarServiceUrl, avatarConfig } = environment;
    return `${avatarServiceUrl}/?name=${nombreLimpio}&background=${avatarConfig.defaultBackground}&color=${avatarConfig.defaultColor}&size=${avatarConfig.defaultSize}&bold=true`;
  }

  /**
   * Procesa y transforma la lista de usuarios
   */
  private procesarUsuarios(usuarios: Usuario[]): Usuario[] {
    return usuarios.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Carga inicial de usuarios
   */
  private cargarUsuarios(): void {
    this.obtenerUsuarios().subscribe();
  }

  /**
   * Busca usuarios por nombre o email
   */
  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const terminoLower = termino.toLowerCase();
    const usuariosFiltrados = this.usuariosMemoria.filter((usuario: Usuario) =>
      usuario.name.toLowerCase().includes(terminoLower) ||
      usuario.email.toLowerCase().includes(terminoLower)
    );
    return of(usuariosFiltrados);
  }
}

```

# app.routes.ts

### Cambio 1: Agrega ruta de edición que reutiliza componente AgregarUsuario

**Por qué:** La nueva ruta `/editar-usuario/:id` apunta al mismo componente `AgregarUsuario`. El componente detecta el parámetro `id` en `ngOnInit`, y si existe, activa modo edición: carga el usuario, prepopula formulario, y muestra botones/textos diferentes. Esto es más eficiente que crear un componente separado, reduciendo código duplicado y manteniendo lógica de formulario consistente.

Se añade la ruta:

<!-- embedme ../../../.labs/Revamping/Reactive_forms/solucion_lab/src/app/app.routes.ts#L25-L28 -->

```ts
{
  path: 'editar-usuario/:id',
  component: AgregarUsuario
},
```
