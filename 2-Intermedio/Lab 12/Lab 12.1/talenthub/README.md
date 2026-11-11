# TalentHub: arquitectura por features (Lab 12.1)

Estructura del proyecto **TalentHub** (Angular 20, standalone, `strict: true`) en tres capas, `core/`, `shared/` y
`features/`, con *barrel files* y alias de rutas, de modo que los laboratorios siguientes puedan crecer sin
acoplamiento. Parte del código del [Lab 11.1](../../../Lab%2011/Lab%2011.1/talenthub/README.md) (modelos, DTO, mapper
y type guard) y añade la estructura, el armazón de la aplicación y las comprobaciones de arquitectura.

El enunciado está en [`../Lab 12.1.md`](../Lab%2012.1.md) (extraído de la primera mitad de `Lab 12.md`) y el briefing
completo del proyecto, en el [Lab 20](../../Lab%2020/Lab%2020.md).

## Instalación y ejecución

El proyecto forma parte del workspace del nivel Intermedio (`2-Intermedio`), que comparte un único `node_modules`
entre los Labs 11 a 19:

```bash
cd 2-Intermedio
npm install               # una sola vez para todo el nivel (o npm ci, para instalar exactamente lo fijado)

cd "Lab 12/Lab 12.1/talenthub"
npm start                 # http://localhost:4200/
```

## Comprobaciones del laboratorio

```bash
npx tsc --noEmit --strict                                  # tipos
npm run lint                                               # ESLint: 0 errores
npm run check:architecture                                 # reglas de arquitectura (barrel, capas, OnPush)
npm run test:architecture                                  # tests de esa comprobación (13)
npx ng build                                               # compilación
npx ng test --watch=false --browsers=ChromeHeadless        # 31 tests (necesitan Chrome o Chromium)
```

## Estructura

```text
src/app/
├── core/                         lo que sirve a toda la aplicación
│   ├── guards/                   authGuard (Lab 13)
│   ├── interceptors/             interceptores de autenticación y de errores (Lab 14)
│   └── layout/navbar, footer     armazón: logo, enlaces y pie de página
├── shared/                       piezas reutilizables sin lógica de negocio
│   ├── components/               spinner, avatar, badge-disponibilidad (laboratorios siguientes)
│   └── validators/               validadores reutilizables (Lab 16)
├── features/                     una carpeta por funcionalidad
│   ├── empleados/                models/ · mappers/ · services/ · resolvers/ · components/ · index.ts
│   ├── proyectos/                models/ · services/ · components/ · index.ts
│   └── dashboard/                components/ · index.ts
└── app.ts, app.html, ...         raíz: navbar + zona de contenido + footer
```

Las carpetas que aún no tienen código llevan un archivo `.gitkeep`, para que git las conserve. La captura de la
estructura está en [`../evidencias/`](../evidencias/): [`estructura.png`](../evidencias/estructura.png) y
[`estructura.txt`](../evidencias/estructura.txt).

## Cómo se aplican las reglas

| Criterio del enunciado | Cómo se garantiza |
| --- | --- |
| La estructura coincide con el esquema de la Fase 1 | Las carpetas existen (con `.gitkeep` si están vacías); véase la captura |
| Barrel files en `empleados`, `proyectos` y `dashboard` | `index.ts` en cada una; sus tests (`index.spec.ts`) comprueban que exponen **exactamente** su API pública |
| Ningún componente importa de la ruta interna de otra feature | `no-restricted-imports` de ESLint para los alias (`@features/x/y`) y `npm run check:architecture` para todo lo demás, incluidas las rutas relativas |
| `ng build` sin errores | Compila; el paquete inicial pesa 244 kB (el briefing pide menos de 500 kB) |

Reglas de `npm run check:architecture` (`scripts/check-architecture.mjs`, con 13 tests propios):

- **barrel:** una feature solo se importa por su barrel (`@features/<feature>`); las rutas internas, solo desde
  dentro de la propia feature. Excepción: el `import()` dinámico de su archivo de rutas (`<feature>.routes`), que
  usará la carga diferida del Lab 13.
- **capas:** `core/` y `shared/` no dependen de `features/`, ni siquiera a través del barrel.
- **onpush:** todo componente usa `ChangeDetectionStrategy.OnPush` (RNF-01 del briefing).

Se comprobó con archivos temporales (ya eliminados) que ESLint y el script detectan las infracciones reales: un
import por alias a una ruta interna, uno relativo, `core` importando de `features` y un componente sin `OnPush`.

## Desviaciones respecto al enunciado

1. **Los barrels usan `export type`.** El proyecto tiene `isolatedModules`, y con él no se puede reexportar un tipo
   con un `export { … }` normal: el barrel del enunciado, que mezcla tipos y valores, no compilaría.
2. **Los alias empiezan por `./`** (`"./src/app/core/*"`). Escritos como en el enunciado (`"src/app/core/*"`),
   TypeScript da el error TS5090 si no hay `baseUrl`, y la compilación falla.
3. **El mapper está en `mappers/`**, no en `models/`: así lo dejó el [Lab 11.1](../../../Lab%2011/Lab%2011.1/Lab%2011.1.md)
   y el barrel apunta a esa ruta. Además se exportan más tipos que en el enunciado (`ActualizarEmpleado`,
   `RolEmpleado`, `Habilidad`), porque forman parte de la API pública de la feature.
4. **`EmpleadoService` y `ProyectoService` son esqueletos vacíos.** El barrel del enunciado los exporta, así que
   tenían que existir; sus métodos llegan con la capa HTTP en los laboratorios siguientes.
5. **El navbar enlaza a `/empleados`, `/proyectos` y `/dashboard`, rutas que se definen en el Lab 13.** Hasta
   entonces los enlaces no llevan a ninguna pantalla.
6. **Se añadió un componente `Dashboard` mínimo** (un marcador) para que el barrel de `dashboard` exporte algo y la
   carpeta `components/dashboard/` del esquema tenga contenido.
7. **Extras:** la comprobación de arquitectura y `OnPush` en todos los componentes (incluido el raíz).

El proyecto es un paquete distinto del Lab 11.1 (`talenthub-lab-12`), porque un workspace de npm no admite dos
paquetes con el mismo nombre.

## Integridad de paquetes y vulnerabilidades (2026-11-11)

Comprobado desde `2-Intermedio` (workspace compartido por los Labs 11 a 19, hoy con dos proyectos):

- **Integridad:** `npm audit signatures` → los 704 paquetes con firma de registro verificada. Las 791 entradas del
  `package-lock.json` llevan hash de integridad y ninguna procede de un origen distinto del registro de npm.
- **`npm audit --omit=dev` (lo que llega al navegador): 0 vulnerabilidades.**
- **`npm audit` completo: 27, todas de gravedad moderada** (0 altas, 0 críticas), en herramientas de desarrollo
  (`glob` y `minimatch` dentro de `@angular/cli`, `angular-eslint` y `typescript-eslint`). `npm audit fix --force`
  propone **bajar de versión**, incompatible con Angular 20, así que no se aplica.
- **Versiones:** Angular 20.3 (CLI 20.3), TypeScript 5.9 y `angular-eslint` 20.7, la línea que fija el curso
  (`Node < 22`).

## Notas del enunciado

El enunciado pide entregar en la rama `lab-12-arquitectura` y una captura de la estructura en el explorador de VS
Code. En este repositorio el trabajo se sube a `main`, y la captura es una imagen generada a partir de la estructura
real de carpetas (no una fotografía del explorador de VS Code).
