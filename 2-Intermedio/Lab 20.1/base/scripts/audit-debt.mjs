#!/usr/bin/env node
// Auditoría de deuda técnica de TalentHub (Lab 20.1): cuenta, sobre el código fuente, cada una de las deficiencias D-01..D-08
// del enunciado. Es un recuento estático (no ejecuta la aplicación) para poder medir el antes y el después del refactor.
//
//   D-01  `any` en el código de producción (anotaciones `: any`, `<any>`, `as any`, `any[]`)
//   D-02  componentes sin `ChangeDetectionStrategy.OnPush`
//   D-03  guards implementados como clase (`implements CanActivate | CanActivateChild | CanDeactivate | CanMatch`)
//   D-04  servicios sin ninguna prueba (no hay un `*.spec.ts` con su nombre)
//   D-05  validaciones definidas dentro de un componente (`ValidatorFn`, `AsyncValidatorFn`, `Validators.pattern`)
//   D-06  bucles sin `track`: `*ngFor` (sin `trackBy`) y `@for` sin `track`
//   D-07  imports entre features que no pasan por el barrel (reglas `barrel` y `features` de `check-architecture`)
//   D-08  componentes con `subscribe()` manual sin cancelación automática (sin `takeUntilDestroyed`), y `ngOnDestroy`
//
// Uso:  node scripts/audit-debt.mjs [--json]      (desde la carpeta del proyecto)

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkArchitecture, ALLOWED_FEATURE_DEPS } from './check-architecture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcApp = join(root, 'src', 'app');

function listTs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return listTs(full);
    return e.name.endsWith('.ts') ? [full] : [];
  });
}

/** Quita los comentarios conservando los saltos de línea. */
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|\s)\/\/.*$/gm, (_, ws) => ws);
const rel = (f) => relative(srcApp, f).replace(/\\/g, '/');

const todos = listTs(srcApp);
const produccion = todos.filter((f) => !f.endsWith('.spec.ts'));
const texto = new Map(produccion.map((f) => [f, sinComentarios(readFileSync(f, 'utf8'))]));
const cuenta = (re, t) => (t.match(re) ?? []).length;

// D-01
const reAny = /(:\s*any\b|<any>|\bas any\b|\bany\[\])/g;
const d01 = produccion.map((f) => [rel(f), cuenta(reAny, texto.get(f))]).filter(([, n]) => n > 0);

// D-02
const componentes = produccion.filter((f) => /@Component\s*\(/.test(texto.get(f)));
const sinOnPush = componentes.filter((f) => !/ChangeDetectionStrategy\.OnPush/.test(texto.get(f)));

// D-03
const guardsDeClase = produccion.filter((f) => /implements\s+[\w\s,]*\bCan(Activate|ActivateChild|Deactivate|Match)\b/.test(texto.get(f)));

// D-04
const servicios = produccion.filter((f) => f.endsWith('.service.ts'));
const servicioSinTest = servicios.filter((f) => {
  const base = f.slice(0, -'.ts'.length);
  const carpeta = dirname(f);
  const nombre = base.split(/[\\/]/).pop();
  return !readdirSync(carpeta).some((n) => n.startsWith(`${nombre}`) && n.endsWith('.spec.ts'));
});

// D-05
const reValidacion = /(\bAsyncValidatorFn\b|\bValidatorFn\b|Validators\.pattern\s*\()/g;
const d05 = componentes.map((f) => [rel(f), cuenta(reValidacion, texto.get(f))]).filter(([, n]) => n > 0);

// D-06
const ngFor = componentes.flatMap((f) => {
  const n = cuenta(/\*ngFor\s*=/g, texto.get(f)) - cuenta(/trackBy\s*:/g, texto.get(f));
  return n > 0 ? [[rel(f), n]] : [];
});
const forSinTrack = componentes.flatMap((f) => {
  const cabeceras = [...texto.get(f).matchAll(/@for\s*\(([^{]*)\)\s*\{/g)].map((m) => m[1]);
  const n = cabeceras.filter((c) => !/;\s*track\b/.test(c)).length;
  return n > 0 ? [[rel(f), n]] : [];
});
const bucles = componentes.reduce((t, f) => t + cuenta(/\*ngFor\s*=/g, texto.get(f)) + cuenta(/@for\s*\(/g, texto.get(f)), 0);

// D-07
const violaciones = checkArchitecture(srcApp, { allowedFeatureDeps: ALLOWED_FEATURE_DEPS }).filter((v) => v.rule === 'barrel' || v.rule === 'features');

// D-08
const conSubscribe = componentes.filter((f) => /\.subscribe\s*\(/.test(texto.get(f)));
const suscripcionesSinCancelar = conSubscribe.filter((f) => !/takeUntilDestroyed\s*\(/.test(texto.get(f)));
const ngOnDestroy = produccion.filter((f) => /\bngOnDestroy\s*\(/.test(texto.get(f)) && f.includes('components'));
const subscribes = componentes.reduce((t, f) => t + cuenta(/\.subscribe\s*\(/g, texto.get(f)), 0);
const toSignals = componentes.reduce((t, f) => t + cuenta(/\btoSignal\s*\(/g, texto.get(f)), 0);

const resultado = {
  componentes: componentes.length,
  'D-01': { total: d01.reduce((t, [, n]) => t + n, 0), archivos: d01 },
  'D-02': { total: sinOnPush.length, de: componentes.length, archivos: sinOnPush.map(rel) },
  'D-03': { total: guardsDeClase.length, archivos: guardsDeClase.map(rel) },
  'D-04': { total: servicioSinTest.length, de: servicios.length, archivos: servicioSinTest.map(rel) },
  'D-05': { total: d05.reduce((t, [, n]) => t + n, 0), archivos: d05 },
  'D-06': {
    total: ngFor.reduce((t, [, n]) => t + n, 0) + forSinTrack.reduce((t, [, n]) => t + n, 0),
    de: bucles,
    ngFor,
    forSinTrack,
  },
  'D-07': { total: violaciones.length, archivos: violaciones.map((v) => `${v.file}:${v.line} (${v.rule})`) },
  'D-08': {
    total: suscripcionesSinCancelar.length,
    de: conSubscribe.length,
    subscribes,
    toSignals,
    ngOnDestroy: ngOnDestroy.length,
    archivos: suscripcionesSinCancelar.map(rel),
    archivosOnDestroy: ngOnDestroy.map(rel),
  },
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(resultado, null, 2));
} else {
  const linea = (id, texto, r) => `${id}  ${String(r.total).padStart(3)}${r.de !== undefined ? ` de ${r.de}` : ''}  ${texto}`;
  console.log('Deuda técnica de TalentHub (recuento estático)\n');
  console.log(linea('D-01', 'usos de `any`', resultado['D-01']));
  console.log(linea('D-02', 'componentes sin OnPush', resultado['D-02']));
  console.log(linea('D-03', 'guards implementados como clase', resultado['D-03']));
  console.log(linea('D-04', 'servicios sin ninguna prueba', resultado['D-04']));
  console.log(linea('D-05', 'validaciones dentro de un componente', resultado['D-05']));
  console.log(linea('D-06', 'bucles sin track (`*ngFor` o `@for` sin track)', resultado['D-06']));
  console.log(linea('D-07', 'imports entre features que no pasan por el barrel', resultado['D-07']));
  console.log(linea('D-08', 'componentes con subscribe() sin takeUntilDestroyed', resultado['D-08']));
  console.log(`      (subscribe() en componentes: ${subscribes}; toSignal(): ${toSignals}; ngOnDestroy en componentes: ${ngOnDestroy.length})`);
  const total = ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07', 'D-08'].reduce((t, id) => t + resultado[id].total, 0);
  console.log(`\nTotal: ${total} hallazgo(s)`);
}
if (!existsSync(srcApp)) process.exit(2);
