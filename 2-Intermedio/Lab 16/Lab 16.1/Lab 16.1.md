
[[_TOC_]]

# Lab 16.1: Formularios reactivos — TalentHub: formulario de alta de empleado

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
