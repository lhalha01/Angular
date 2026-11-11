// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

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
      // Criterio del Lab 11.1: ni `any` explícito ni `as any` como atajo para compilar.
      "@typescript-eslint/no-explicit-any": "error",
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
    // Los DTOs describen el formato de la API y no deben salir de la capa de mapeo:
    // solo los `*.mapper.ts` (y sus tests) pueden importarlos. El resto de la aplicación
    // trabaja con los modelos de dominio.
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.mapper.ts", "src/**/*.mapper.spec.ts", "src/**/*.dto.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/*.dto"],
              message:
                "Los DTOs solo pueden importarse desde un *.mapper.ts. Usa el modelo de dominio y la función de mapeo.",
            },
          ],
        },
      ],
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
