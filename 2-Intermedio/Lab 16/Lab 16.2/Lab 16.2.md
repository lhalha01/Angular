[[_TOC_]]

# Lab 16.2: Formularios reactivos — formulario de tarea con fechas y etiquetas

> Extraído de `../Lab 16.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 15.2](../../Lab%2015/Lab%2015.2/Lab%2015.2.md).

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
