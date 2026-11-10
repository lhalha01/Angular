
# Lab 01: Primera aplicación en Angular - Hello World!

Una vez instalados todos los prerrequisitos (Node.js y Angular CLI), procedemos a crear nuestra primera aplicación Angular.

## Requisitos de Versión

- Versi�n de Node: < 22.0.0
- Versi�n de Angular: 20.0.0

## Pasos para Crear la Aplicación

Ejecuta los siguientes comandos desde **PowerShell** o **cmd**:

### 1. Instalar Angular CLI (si no lo tienes instalado)

```bash
npm install -g @angular/cli
```

### 2. Crear nueva aplicación

```bash
ng new helloWorld
```

Durante la creación, Angular CLI te hará varias preguntas. Para un curso básico, se recomienda:

- **¿Quieres añadir Angular routing?**: `No` (lo veremos más adelante)
- **¿Qué formato de hojas de estilo prefieres?**: `SASS` (para empezar)

**⚠️ Nota**: Evita opciones experimentales como "zoneless" para aplicaciones de aprendizaje básico.

### 3. Navegar al directorio del proyecto

```bash
cd helloWorld
```

### 4. Iniciar el servidor de desarrollo

```bash
npm start
```

o alternativamente:

```bash
ng serve
```

![Servidor ejecutándose](/.attachments/run-start-27ec2273-4c88-4a11-82de-46dee9fb7a8e.png)

### 5. Visualizar la aplicación

Abre tu navegador y navega a: `http://localhost:4200/`

![Aplicación ejecutándose](/.attachments/run-start-2-a983b643-0121-4ce4-a28d-604fa2c94485.png)

## Estructura del Proyecto

Una vez creada la aplicación, verás la siguiente estructura de carpetas:

![Estructura de carpetas](</.attachments/Básico/Instalacion%20y%20arranque/Lab%2001%20Primera%20aplicación%20en%20Angular.%20Hello%20World!/primera-carpetas.png>)

### Archivos y Carpetas Principales

#### Carpetas del Proyecto

- **src/**

  - Es la carpeta más importante del proyecto, contiene todo el código fuente de tu aplicación Angular.
  - Aquí es donde pasarás la mayor parte del tiempo desarrollando tu aplicación.
  - Incluye subcarpetas como `app/`, `assets/`, y archivos de configuración como `index.html` y `main.ts`.
- **src/app/**

  - Es el corazón de tu aplicación Angular.
  - Contiene todos los componentes, servicios, módulos, directivas y pipes que crearás.
  - Por defecto, Angular CLI genera el componente principal `app.component.ts` en esta carpeta.
  - A medida que tu aplicación crezca, aquí organizarás toda tu lógica de negocio.
- **src/assets/**

  - Almacena recursos estáticos como imágenes, iconos, fuentes y otros archivos que no requieren procesamiento.
  - Los archivos en esta carpeta se copian tal cual al directorio de salida cuando compilas la aplicación.
  - Puedes acceder a estos recursos directamente mediante rutas relativas en tu HTML o CSS.
- **node_modules/**

  - Carpeta generada automáticamente por npm cuando ejecutas `npm install`.
  - Contiene todas las dependencias y librerías de terceros que tu proyecto necesita.
  - **⚠️ Importante**: No modifiques manualmente esta carpeta ni la incluyas en control de versiones (Git).
  - Puede ser regenerada en cualquier momento ejecutando `npm install` desde el `package.json`.

#### Archivos de Configuración

- **angular.json**

  - Archivo de configuración principal del workspace de Angular.
  - Define opciones de compilación, configuración del servidor de desarrollo, rutas de archivos y assets.
  - Permite personalizar el comportamiento del Angular CLI para tu proyecto.
  - Aquí se configuran múltiples entornos (desarrollo, producción) y sus respectivas optimizaciones.
- **package.json**

  - Archivo estándar de Node.js que define las dependencias del proyecto.
  - Lista todas las librerías necesarias con sus versiones específicas.
  - Contiene scripts de npm para ejecutar tareas comunes como `start`, `build`, `test`.
  - Es esencial para que otros desarrolladores puedan instalar las mismas dependencias con `npm install`.
- **tsconfig.json**

  - Archivo de configuración del compilador de TypeScript.
  - Define cómo TypeScript compilará tu código a JavaScript.
  - Especifica opciones como el nivel de compatibilidad de JavaScript (target), módulos, rutas y reglas de tipado estricto.
  - Angular utiliza TypeScript por defecto para aprovechar el tipado estático y las características modernas de JavaScript.

## Siguiente Paso

En el siguiente laboratorio exploraremos en detalle los archivos principales de la aplicación y cómo funciona el flujo de arranque de Angular.

![Vista de archivos](/.attachments/run-start-3-cd257e3c-7abf-46a0-a170-e0c1d11966b6.png)

## Referencias Oficiales

- [Angular CLI Documentación Oficial](https://angular.dev/tools/cli)
- [Angular Getting Started Guide](https://angular.dev/tutorials/learn-angular)
- [Angular CLI Commands](https://angular.dev/cli)
- [Angular Workspace Configuration](https://angular.dev/reference/configs/workspace-config)
- [Angular Development Server](https://angular.dev/tools/cli/serve)
