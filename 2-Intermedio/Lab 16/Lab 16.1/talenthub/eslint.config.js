// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

// Una feature se importa a través de su barrel (`@features/<feature>`), no de una ruta interna.
// (`no-restricted-imports` solo mira los `import ... from` estáticos: el import dinámico del archivo de
// rutas, que usa la carga diferida del Lab 13, queda fuera. `npm run check:architecture` cubre el resto.)
const DEEP_FEATURE_IMPORT = {
  group: ["@features/*/*"],
  message: "Importa la feature a través de su barrel (`@features/<feature>`), no de una ruta interna.",
};

// Los DTOs describen el formato de la API y no deben salir de la capa de mapeo.
const DTO_IMPORT = {
  group: ["**/*.dto"],
  message:
    "Los DTOs solo pueden importarse desde un *.mapper.ts. Usa el modelo de dominio y la función de mapeo.",
};

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Sin `any` explícito ni `as any` como atajo para compilar (RNF-06 del briefing).
      "@typescript-eslint/no-explicit-any": "error",
      // Los parámetros que empiezan por `_` están sin usar a propósito (p. ej. `AuthService.login`, que simula la sesión).
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    // En todo el código: sin imports a rutas internas de otra feature.
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [DEEP_FEATURE_IMPORT] }],
    },
  },
  {
    // Salvo los mappers (y sus tests), nadie importa un DTO. Esta configuración sustituye a la anterior para
    // esos archivos, así que repite la regla de las features.
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.mapper.ts", "src/**/*.mapper.spec.ts", "src/**/*.dto.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [DTO_IMPORT, DEEP_FEATURE_IMPORT] }],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
