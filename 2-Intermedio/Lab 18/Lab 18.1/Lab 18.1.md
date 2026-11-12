
[[_TOC_]]

# Lab 18.1: Testing pragmático — TalentHub: cobertura de los artefactos críticos

## Objetivo

Cubrir con tests los cuatro artefactos más críticos del MVP de TalentHub: `EmpleadoService`, `authGuard`, el validador de email único y el componente `DirectorioEmpleados`.

## Prerequisitos

- Lab 17 completado.
- Leer el capítulo [Testing pragmático](./Introducción.md).

---

## Fase 1 — Tests de EmpleadoService (25 min)

```typescript
// features/empleados/services/empleado.service.spec.ts
describe('EmpleadoService', () => {
  let service: EmpleadoService;
  let http: HttpTestingController;

  const mockDto: EmpleadoDto = {
    id: 1, name: 'Ana Martínez', email: 'ana@example.com',
    phone: '', website: '', company: { name: 'Nexus' }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(EmpleadoService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('mapea el DTO a Empleado correctamente', () => {
    let resultado: Empleado[] = [];
    service.getAll().subscribe(e => resultado = e);
    http.expectOne(/users/).flush([mockDto]);
    expect(resultado[0].nombre).toBe('Ana Martínez');
    expect(resultado[0].email).toBe('ana@example.com');
  });

  it('devuelve null cuando el empleado no existe (404)', () => {
    let resultado: Empleado | null = undefined as any;
    service.getById(999).subscribe(e => resultado = e);
    http.expectOne(/users\/999/).flush('', { status: 404, statusText: 'Not Found' });
    expect(resultado).toBeNull();
  });
});
```

---

## Fase 2 — Tests del authGuard (15 min)

```typescript
// core/guards/auth.guard.spec.ts
describe('authGuard', () => {
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authMock = jasmine.createSpyObj('AuthService', ['estaAutenticado']);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authMock }]
    });
  });

  it('permite el acceso cuando está autenticado', () => {
    authMock.estaAutenticado.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any)
    );
    expect(result).toBeTrue();
  });

  it('redirige al login cuando no está autenticado', () => {
    authMock.estaAutenticado.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/empleados' } as any)
    );
    expect(result).not.toBeTrue();
  });
});
```

---

## Fase 3 — Tests del validador emailUnico (10 min)

```typescript
describe('emailUnicoValidator', () => {
  it('marca como duplicado si el email contiene "test"', (done) => {
    const validator = emailUnicoValidator();
    (validator(new FormControl('test@example.com')) as Observable<any>).subscribe(err => {
      expect(err).toEqual({ emailDuplicado: true });
      done();
    });
  });

  it('acepta emails válidos', (done) => {
    const validator = emailUnicoValidator();
    (validator(new FormControl('ana@example.com')) as Observable<any>).subscribe(err => {
      expect(err).toBeNull();
      done();
    });
  });
});
```

---

## Fase 4 — Test del componente DirectorioEmpleados (20 min)

```typescript
describe('DirectorioEmpleados', () => {
  const mockEmpleados: Empleado[] = [
    { id: 1, nombre: 'Ana', email: 'ana@example.com', rol: 'desarrollador',
      habilidades: [], disponible: true, proyectoActualId: null, fechaIncorporacion: new Date() }
  ];

  beforeEach(async () => {
    const facadeMock = jasmine.createSpyObj('EmpleadosFacade', ['cargar'], {
      empleados: signal(mockEmpleados),
      cargando:  signal(false)
    });
    await TestBed.configureTestingModule({
      imports:   [DirectorioEmpleados],
      providers: [{ provide: EmpleadosFacade, useValue: facadeMock }]
    }).compileComponents();
  });

  it('muestra los empleados recibidos', () => {
    const fixture = TestBed.createComponent(DirectorioEmpleados);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana');
  });

  it('llama a cargar() al inicializarse', () => {
    const facadeMock = TestBed.inject(EmpleadosFacade) as any;
    TestBed.createComponent(DirectorioEmpleados);
    expect(facadeMock.cargar).toHaveBeenCalledOnce();
  });
});
```

---

## Criterios de aceptación

- `ng test --code-coverage` muestra > 70% en `features/empleados/services/`.
- `authGuard` tiene cobertura del 100%.
- Los dos casos del validador async pasan.
- El componente `DirectorioEmpleados` tiene al menos 2 tests.

## Entregable

Rama `lab-18-testing`. Captura del resumen de cobertura de Karma.
