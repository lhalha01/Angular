# TalentHub: formularios reactivos (Lab 16.1)

**TalentHub** (Angular 20, standalone, `strict: true`) con el **formulario de alta de empleado** hecho con Reactive Forms:
validadores síncronos y asíncrono, validación cruzada de disponibilidad y proyecto, una lista dinámica de habilidades
(`FormArray`) y la protección de doble envío del Lab 15. Parte del
[Lab 15.1](../../../Lab%2015/Lab%2015.1/talenthub/README.md).

El enunciado está en [`../Lab 16.1.md`](../Lab%2016.1.md) (extraído de la primera mitad de `Lab 16.md`) y el briefing
completo del proyecto, en el [Lab 20](../../Lab%2020/Lab%2020.md).

## Instalación y ejecución

El proyecto forma parte del workspace del nivel Intermedio (`2-Intermedio`), que comparte un único `node_modules`.
**TalentHub usa siempre el backend local** (`/users` y `/todos`), así que hay que arrancarlo antes:

```bash
# 1. backend (desde la carpeta backend/ del repositorio; necesita Python 3.11 o superior)
.\start.cmd               # Windows;  en Linux/macOS: ./start.sh

# 2. aplicación
cd 2-Intermedio
npm install               # una sola vez para todo el nivel (o npm ci)
cd "Lab 16/Lab 16.1/talenthub"
npm start                 # http://localhost:4200/  (cualquier email y contraseña sirven en el login)
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                  # tipos
npm run lint                                               # ESLint: 0 errores
npm run check:architecture                                 # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                  # tests de esa comprobación (13)
npx ng build                                               # compilación
npx ng test --watch=false --browsers=ChromeHeadless        # 210 tests, 100 % de líneas (no necesitan el backend)
```

## Qué hay de nuevo respecto al Lab 15.1

```text
src/app/
├── shared/validators/
│   ├── solo-letras.validator.ts          soloLetrasYEspacios (letras con tildes, ñ y espacios)
│   ├── email-unico.validator.ts          emailUnicoValidator (asíncrono, 400 ms; simulado: duplicado si contiene «test»)
│   └── proyecto-obligatorio.validator.ts proyectoObligatorioSiOcupado (cruzado: error del grupo)
└── features/empleados/components/formulario-alta/   formulario reactivo: nombre, email, rol, disponible, proyecto, habilidades
```

| Criterio del enunciado | Cómo se cumple |
| --- | --- |
| Los errores se muestran solo tras tocar el campo o intentar enviar | `mostrarError(control)` = inválido y (tocado o enviado); capturas en `errores-visibles.png` |
| El validador async marca como duplicado cualquier email que contenga «test» | `emailUnicoValidator` (con «Comprobando el email…» mientras espera 400 ms) |
| Si `disponible = false` y no hay proyecto, error cruzado | `proyectoObligatorioSiOcupado`, error del grupo; `error-cruzado.png` |
| Se pueden añadir y eliminar habilidades dinámicamente | `FormArray` con nombre (obligatorio, máx. 30) y nivel; `habilidades-dinamicas.png` |
| El botón «Dar de alta» queda desactivado mientras se procesa | `enviando` (se pone antes del envío y se quita con `finalize`) |

## Desviaciones respecto al enunciado

1. **Los validadores síncronos aceptan el valor vacío.** `soloLetrasYEspacios` del enunciado rechaza la cadena vacía (la
   expresión regular usa `+`), con lo que un campo vacío daría dos errores a la vez. Aquí de exigirlo se encarga
   `Validators.required`.
2. **`emailUnicoValidator` sigue siendo una simulación**, como pide el enunciado («cualquier email que contenga `test`»).
   Con el backend local se podría comprobar de verdad con `GET /users?q=<email>`, pero eso cambiaría el criterio de
   aceptación y el test del Lab 18; se deja para cuando el enunciado lo pida. No distingue mayúsculas.
3. **El validador asíncrono no consulta si el formato del email es inválido** (Angular solo ejecuta los asíncronos con los
   síncronos en regla), y con el email aún en comprobación (`PENDING`) el formulario no se envía.
4. **El formulario ofrece los proyectos de la API** (`ProyectoService`, que lee `/todos`) en el selector «Proyecto actual»; si
   no cargan, «Sin proyecto» sigue disponible. El enunciado no dice de dónde salen.
5. **El error cruzado se muestra al tocar cualquier campo o al intentar enviar** (`form.touched || enviado`), no solo al
   tocar el selector de proyecto.
6. **La protección de doble envío del Lab 15 se conserva** (`Subject` + `exhaustMap` + `takeUntilDestroyed`): el botón se
   desactiva además mientras se envía, y el error HTTP lo avisa el interceptor sin cerrar el flujo.
7. **`tieneCambiosPendientes()` sale de `form.dirty`** (y se marca como sucio al añadir o quitar una habilidad, que no lo
   hace sola). Tras el alta ya no se pide confirmar al salir.
8. **El alta es real** (`POST /users`): el backend solo guarda nombre y email; rol, habilidades, disponibilidad y proyecto
   se conservan del formulario pero no se persisten (la API no los tiene). Las pruebas no tocan la base de datos real.
9. **Accesibilidad:** cada habilidad lleva nombres accesibles que incluyen su número, y los errores se anuncian con
   `role="alert"`.

## Evidencias

En [`../evidencias/`](../evidencias/): [`errores-visibles.png`](../evidencias/errores-visibles.png),
[`habilidades-dinamicas.png`](../evidencias/habilidades-dinamicas.png) y
[`error-cruzado.png`](../evidencias/error-cruzado.png) (cada una con capturas reales del formulario; `evidencias.txt`
resume los textos). Salen de un recorrido automatizado en Chrome contra el build de producción y el backend local;
no se guarda ningún empleado.

## Notas del enunciado

El enunciado pide entregar en la rama `lab-16-forms`. En este repositorio el trabajo se sube a `main`.
