# HelloWorld

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.42.

## Verificación de requisitos del Lab 01

Revisión del proyecto frente a `Lab 01.md` (2026-11-10). No se ejecutó `ng serve`; la revisión se hizo sobre los archivos del proyecto.

| Requisito | Estado | Evidencia |
|---|---|---|
| Node < 22.0.0 | ✅ | Node instalado: v20.20.1 |
| Angular 20.0.0 | ✅ | `@angular/core` 20.3.35 (línea 20.x, no exactamente 20.0.0) |
| Nombre `helloWorld` | ✅ | Proyecto `helloWorld` en `angular.json` |
| Sin routing | ✅ | No hay `app.routes.ts` ni `provideRouter` en `app.config.ts` |
| Hojas de estilo SASS | ✅ | `app.scss`, `styles.scss` y `"style": "scss"` en `angular.json` |
| Sin zoneless | ✅ | Usa `provideZoneChangeDetection` y `zone.js` como polyfill |
| `npm start` / `ng serve` | ✅ | Script `start` = `ng serve`; builder `dev-server` configurado |
| Estructura del proyecto | ⚠️ | Ver notas |

Notas sobre la estructura (la guía está algo desactualizada para Angular 20):

- No existe `src/assets/`: los recursos estáticos están en `public/` (`public/favicon.ico`).
- El componente principal se genera como `app.ts`, `app.html` y `app.scss`, no `app.component.ts`.
- `node_modules/` está excluido en `.gitignore`.

**Conclusión:** el proyecto cumple los requisitos del Lab 01.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
