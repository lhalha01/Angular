#!/usr/bin/env node
// Comprobación de arquitectura de TalentHub (Lab 12): lo que ESLint no cubre bien.
//
// Reglas (se aplican a todos los `.ts` de `src/app`, tests incluidos, salvo donde se indica):
//   barrel     Una feature solo se importa a través de su barrel (`@features/<feature>`). Las rutas internas
//              (`@features/x/models/...` o `../../x/models/...`) solo se pueden usar dentro de la propia feature.
//              Excepción: el import dinámico de su archivo de rutas (`features/<f>/<f>.routes`), que es el punto
//              de entrada de la carga diferida (Lab 13).
//   capas      `core/` y `shared/` no pueden depender de `features/` (ni siquiera a través del barrel).
//   onpush     Todo componente usa `ChangeDetectionStrategy.OnPush` (RNF-01 del briefing). No se exige a los tests.
//
// Uso:  node scripts/check-architecture.mjs        (desde la carpeta del proyecto; código de salida 1 si falla)

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALIAS = { '@core/': 'core/', '@shared/': 'shared/', '@features/': 'features/' };

/** Lista recursivamente los `.ts` de un directorio. */
function listTs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return listTs(full);
    return e.name.endsWith('.ts') ? [full] : [];
  });
}

/** Quita los comentarios conservando los saltos de línea (para que los números de línea sigan valiendo). */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, (_, ws) => ws);
}

/** A qué capa o feature pertenece una ruta relativa a `src/app` (con `/` como separador). */
function ownerOf(path) {
  const feature = /^features\/([^/]+)\//.exec(path);
  if (feature) return { layer: 'features', feature: feature[1] };
  if (path.startsWith('core/')) return { layer: 'core' };
  if (path.startsWith('shared/')) return { layer: 'shared' };
  return { layer: 'app' };
}

/** Convierte un especificador de import en una ruta relativa a `src/app`, o `null` si es externo o queda fuera. */
function resolveSpecifier(spec, fromPath) {
  for (const [alias, target] of Object.entries(ALIAS)) {
    if (spec.startsWith(alias)) return target + spec.slice(alias.length);
  }
  if (spec.startsWith('./') || spec.startsWith('../')) {
    const resolved = posix.normalize(posix.join(posix.dirname(fromPath), spec));
    return resolved.startsWith('..') ? null : resolved;
  }
  return null;
}

const IMPORT_RE =
  /\b(?:import|export)\b[^;'"]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/**
 * Comprueba las reglas sobre `srcApp` (la carpeta `src/app`) y devuelve la lista de infracciones:
 * `{ file, line, rule, message }`.
 */
export function checkArchitecture(srcApp) {
  const violations = [];

  for (const file of listTs(srcApp)) {
    const path = relative(srcApp, file).split('\\').join('/');
    const text = stripComments(readFileSync(file, 'utf8'));
    const owner = ownerOf(path);
    const report = (index, rule, message) => violations.push({ file: path, line: lineOf(text, index), rule, message });

    for (const match of text.matchAll(IMPORT_RE)) {
      const spec = match[1] ?? match[2] ?? match[3];
      const target = resolveSpecifier(spec, path);
      if (target === null) continue;

      const clean = target.replace(/\.ts$/, '').replace(/\/index$/, '').replace(/\/$/, '');
      const targetOwner = ownerOf(clean + '/');

      if (targetOwner.layer === 'features' && (owner.layer !== 'features' || owner.feature !== targetOwner.feature)) {
        const f = targetOwner.feature;
        const isBarrel = clean === `features/${f}`;
        const isRoutes = clean === `features/${f}/${f}.routes`;
        if (!isBarrel && !isRoutes) {
          report(match.index, 'barrel', `'${spec}' entra en una ruta interna de la feature '${f}': importa '@features/${f}'.`);
        }
      }

      if ((owner.layer === 'core' || owner.layer === 'shared') && targetOwner.layer === 'features') {
        report(match.index, 'capas', `'${owner.layer}' no puede depender de 'features' ('${spec}').`);
      }
    }

    const esTest = path.endsWith('.spec.ts');
    const component = /@Component\s*\(/.exec(text);
    if (!esTest && component && !/ChangeDetectionStrategy\.OnPush/.test(text)) {
      report(component.index, 'onpush', 'El componente debe usar ChangeDetectionStrategy.OnPush.');
    }
  }

  return violations;
}

// Ejecución desde la línea de comandos
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const srcApp = resolve(process.cwd(), 'src', 'app');
  const violations = checkArchitecture(srcApp);
  if (violations.length === 0) {
    console.log('Arquitectura correcta: sin infracciones (reglas: barrel, capas, onpush).');
  } else {
    for (const v of violations) console.error(`src/app/${v.file}:${v.line}  [${v.rule}]  ${v.message}`);
    console.error(`\n${violations.length} infracción(es) de arquitectura.`);
    process.exit(1);
  }
}
