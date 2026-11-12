[[_TOC_]]

# Lab 18.2: Testing pragmático — tests de la aplicación de tareas

> Extraído de `../Lab 18.md` (segunda mitad del documento original).
> Continúa el itinerario "tareas y usuarios" del [Lab 17.2](../../Lab%2017/Lab%2017.2/Lab%2017.2.md).

## Prerequisitos

- Lab 17 completado.
- Leer el capítulo [Testing pragmático](./Introducción.md).

---

## Fase 1 — Tests de TareaService (25 min)

Crea `features/tareas/services/tarea.service.spec.ts`:

```typescript
describe('TareaService', () => {
  let service: TareaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TareaService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('mapea el DTO correctamente', () => {
    let resultado: Tarea[] = [];
    service.getAll().subscribe(t => resultado = t);
    http.expectOne(/todos/).flush([{ id: 1, title: 'Test', completed: false, userId: 1 }]);
    expect(resultado[0].titulo).toBe('Test');
    expect(resultado[0].completada).toBeFalse();
  });

  it('devuelve null en 404', () => {
    let resultado: Tarea | null = undefined as any;
    service.getById(999).subscribe(t => resultado = t);
    http.expectOne(/todos\/999/).flush('', { status: 404, statusText: 'Not Found' });
    expect(resultado).toBeNull();
  });
});
```

---

## Fase 2 — Tests de validadores (15 min)

Crea `shared/validators/custom.validators.spec.ts` con al menos 3 casos por validador:

```typescript
describe('fechasValidas', () => {
  it('acepta fechas correctas', () => { /* ... */ });
  it('rechaza fecha fin anterior a inicio', () => { /* ... */ });
  it('acepta si alguna fecha es vacía', () => { /* ... */ });
});
```

---

## Fase 3 — Test del guard (15 min)

Crea `core/guards/auth.guard.spec.ts` siguiendo el ejemplo del capítulo. Cubre:

- Usuario autenticado → permite el acceso.
- Usuario no autenticado → redirige con `returnUrl`.

---

## Fase 4 — Test del componente ListaTareas (20 min)

```typescript
describe('ListaTareas', () => {
  const mockTareas = [{ id: 1, titulo: 'Test', completada: false, prioridad: 'media', fechaCreacion: new Date(), usuarioId: 1 }];

  beforeEach(async () => {
    const facadeMock = jasmine.createSpyObj('TareasFacade', ['cargar', 'eliminar'], {
      tareas:   signal(mockTareas),
      cargando: signal(false)
    });
    await TestBed.configureTestingModule({
      imports:   [ListaTareas],
      providers: [{ provide: TareasFacade, useValue: facadeMock }]
    }).compileComponents();
  });

  it('muestra las tareas recibidas', () => {
    const fixture = TestBed.createComponent(ListaTareas);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test');
  });
});
```

---

## Criterios de aceptación

- `ng test --code-coverage` muestra > 70% de cobertura en `features/tareas/services/`.
- El guard tiene cobertura del 100% (es código pequeño y crítico).
- Los validadores tienen al menos un test por caso positivo y uno por caso negativo.
- Todos los tests pasan en el pipeline CI (`ng test --watch=false`).

## Entregable

Rama o commit. Captura del resumen de cobertura de Karma.
