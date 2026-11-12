
[[_TOC_]]

# Lab 16: Formularios reactivos — TalentHub: formulario de alta de empleado

## Objetivo

Implementar el formulario de incorporación de nuevos empleados con Reactive Forms, FormArray de habilidades, validadores personalizados y validación cruzada de disponibilidad/proyecto.

## Prerequisitos

- Lab 15 completado.
- Leer el capítulo [Formularios reactivos y validaciones](./Introducción.md).

---

## Fase 1 — FormGroup base (20 min)

```typescript
// features/empleados/components/formulario-alta/formulario-alta.component.ts
export class FormularioAlta {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    nombre:           ['', [Validators.required, soloLetrasYEspacios]],
    email:            ['', [Validators.required, Validators.email], [emailUnicoValidator()]],
    rol:              ['desarrollador' as RolEmpleado, Validators.required],
    disponible:       [true],
    proyectoActualId: [null as number | null],
    habilidades:      this.fb.array([])
  }, { validators: proyectoObligatorioSiOcupado });

  get habilidades() { return this.form.get('habilidades') as FormArray; }
  get nombre()      { return this.form.controls.nombre; }
  get email()       { return this.form.controls.email;  }
}
```

---

## Fase 2 — Validadores personalizados en shared/ (20 min)

Crea `src/app/shared/validators/`:

```typescript
// no-espacios.validator.ts  (ya no spaces al inicio/fin)
export const soloLetrasYEspacios: ValidatorFn = (control) =>
  /^[a-zA-ZÀ-ɏñÑ\s]+$/.test(control.value) ? null : { soloLetras: true };

// email-unico.validator.ts  (sim: email es único si no contiene 'test')
export const emailUnicoValidator = (): AsyncValidatorFn =>
  (control) => timer(400).pipe(
    switchMap(() => of(control.value?.includes('test') ? { emailDuplicado: true } : null))
  );

// proyecto-obligatorio.validator.ts  (cross-field)
export const proyectoObligatorioSiOcupado: ValidatorFn = (group) => {
  const disponible = group.get('disponible')?.value;
  const proyectoId = group.get('proyectoActualId')?.value;
  return !disponible && !proyectoId ? { proyectoObligatorio: true } : null;
};
```

---

## Fase 3 — FormArray de habilidades (15 min)

```typescript
agregarHabilidad(): void {
  this.habilidades.push(
    this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(30)]],
      nivel:  ['mid', Validators.required]
    })
  );
}

eliminarHabilidad(i: number): void { this.habilidades.removeAt(i); }
```

En el template:

```html
<div formArrayName="habilidades">
  @for (ctrl of habilidades.controls; track $index; let i = $index) {
    <div [formGroupName]="i" class="habilidad-row">
      <input formControlName="nombre" placeholder="Habilidad" />
      <select formControlName="nivel">
        <option value="junior">Junior</option>
        <option value="mid">Mid</option>
        <option value="senior">Senior</option>
      </select>
      <button type="button" (click)="eliminarHabilidad(i)">✕</button>
    </div>
  }
</div>
```

---

## Criterios de aceptación

- Los errores se muestran solo tras tocar el campo o intentar enviar.
- El validador async marca como duplicado cualquier email que contenga 'test'.
- Si `disponible = false` y no hay proyecto seleccionado, el formulario muestra error cross-field.
- Se pueden añadir y eliminar habilidades dinámicamente.
- El botón "Dar de alta" queda desactivado mientras se procesa.

## Entregable

Rama `lab-16-forms`. Capturas: formulario con errores visibles, habilidades dinámicas y error cross-field.

## Prerequisitos

- Lab 15 completado.
- Leer el capítulo [Formularios reactivos y validaciones](./Introducción.md).

---

## Fase 1 — FormGroup base (20 min)

```typescript
export class FormularioTarea {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    titulo:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    descripcion:  [''],
    prioridad:    ['media' as Tarea['prioridad'], Validators.required],
    completada:   [false],
    fechaInicio:  [''],
    fechaFin:     ['']
  }, { validators: fechasValidas });

  get titulo()     { return this.form.controls.titulo; }
  get fechaFin()   { return this.form.controls.fechaFin; }
}
```

---

## Fase 2 — Validador cross-field de fechas (15 min)

```typescript
// shared/validators/fechas.validator.ts
export const fechasValidas: ValidatorFn = (group) => {
  const inicio = group.get('fechaInicio')?.value;
  const fin    = group.get('fechaFin')?.value;
  if (!inicio || !fin) return null;
  return new Date(fin) > new Date(inicio) ? null : { fechaFinAnterior: true };
};
```

Muestra el error en el template:

```html
@if (form.errors?.['fechaFinAnterior'] && form.touched) {
  <p class="error">La fecha de fin debe ser posterior a la de inicio.</p>
}
```

---

## Fase 3 — FormArray de etiquetas (20 min)

```typescript
form = this.fb.group({
  /* ...campos anteriores... */,
  etiquetas: this.fb.array([])
});

get etiquetas() { return this.form.get('etiquetas') as FormArray; }

agregarEtiqueta(): void {
  this.etiquetas.push(this.fb.control('', [Validators.required, Validators.maxLength(20)]));
}

eliminarEtiqueta(i: number): void { this.etiquetas.removeAt(i); }
```

---

## Fase 4 — UX del envío (10 min)

```typescript
enviando = signal(false);

onSubmit(): void {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.enviando.set(true);
  this.tareaService.crear(this.form.value as NuevaTarea).pipe(
    finalize(() => this.enviando.set(false))
  ).subscribe({
    next: () => this.router.navigate(['/tareas']),
    error: err => this.notif.error(err.message)
  });
}
```

---

## Criterios de aceptación

- Los errores de validación se muestran solo al pulsar el campo o al intentar enviar.
- El validador cross-field muestra el error en el grupo, no en un campo individual.
- Se pueden añadir y eliminar etiquetas dinámicamente.
- El botón de envío se desactiva mientras se procesa la petición.
- `ng lint` sin errores nuevos.

## Entregable

Rama o commit. Capturas del formulario con errores visibles, sin errores y del FormArray de etiquetas en uso.
