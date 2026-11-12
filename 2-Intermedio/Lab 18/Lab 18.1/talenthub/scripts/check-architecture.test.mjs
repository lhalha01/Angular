// Tests de la comprobación de arquitectura:  npm run test:architecture
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkArchitecture } from './check-architecture.mjs';

/** Crea un `src/app` temporal con los archivos indicados y devuelve su ruta y cómo borrarlo. */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'arch-'));
  const src = join(root, 'src', 'app');
  for (const [path, content] of Object.entries(files)) {
    const full = join(src, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return { src, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

function check(files) {
  const f = fixture(files);
  try {
    return checkArchitecture(f.src);
  } finally {
    f.cleanup();
  }
}

const rules = (violations) => violations.map((v) => v.rule);
const COMPONENT = (name = 'X') =>
  `import { ChangeDetectionStrategy, Component } from '@angular/core';\n` +
  `@Component({ selector: 'app-x', changeDetection: ChangeDetectionStrategy.OnPush, template: '' })\nexport class ${name} {}\n`;

test('el proyecto real cumple todas las reglas', () => {
  const real = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app');
  assert.deepEqual(checkArchitecture(real), []);
});

test('permite importar una feature a través de su barrel', () => {
  const v = check({
    'features/empleados/index.ts': 'export const A = 1;\n',
    'features/proyectos/components/lista.ts': `import { A } from '@features/empleados';\nexport const B = A;\n`,
  });
  assert.deepEqual(v, []);
});

test('prohíbe entrar en una ruta interna de otra feature (alias)', () => {
  const v = check({
    'features/proyectos/components/lista.ts': `import { M } from '@features/empleados/models/empleado.model';\n`,
  });
  assert.deepEqual(rules(v), ['barrel']);
  assert.match(v[0].message, /@features\/empleados/);
});

test('prohíbe entrar en una ruta interna de otra feature (ruta relativa)', () => {
  const v = check({
    'features/proyectos/components/lista.ts': `import { M } from '../../empleados/models/empleado.model';\n`,
  });
  assert.deepEqual(rules(v), ['barrel']);
});

test('también lo prohíbe desde fuera de las features (app, core, shared)', () => {
  const v = check({
    'app.ts': `import { S } from '@features/empleados/services/empleado.service';\n`,
    'core/algo.ts': `import { S } from '@features/empleados/services/empleado.service';\n`,
  });
  assert.equal(v.filter((x) => x.rule === 'barrel').length, 2);
});

test('permite el import dinámico del archivo de rutas de una feature (carga diferida)', () => {
  const v = check({
    'app.routes.ts': `export const r = () => import('@features/dashboard/dashboard.routes');\n`,
  });
  assert.deepEqual(v, []);
});

test('dentro de su propia feature se puede importar cualquier ruta interna', () => {
  const v = check({
    'features/empleados/models/m.ts': 'export const M = 1;\n',
    'features/empleados/components/c.ts': `import { M } from '../models/m';\nimport { M as N } from '@features/empleados/models/m';\n`,
  });
  assert.deepEqual(v, []);
});

test('core y shared no pueden depender de features, ni siquiera por el barrel', () => {
  const v = check({
    'core/a.ts': `import { A } from '@features/empleados';\n`,
    'shared/b.ts': `import { A } from '../features/empleados';\n`,
  });
  assert.deepEqual(rules(v).sort(), ['capas', 'capas']);
});

test('detecta imports escritos en varias líneas y reexports', () => {
  const v = check({
    'features/proyectos/c.ts':
      `import {\n  A,\n  B,\n} from '@features/empleados/models/empleado.model';\n` +
      `export type { C } from '@features/empleados/services/empleado.service';\n`,
  });
  assert.deepEqual(rules(v), ['barrel', 'barrel']);
  assert.equal(v[0].line, 1); // la línea donde empieza la sentencia, como hacen los editores y ESLint
  assert.equal(v[1].line, 5);
});

test('ignora los imports que solo aparecen en comentarios', () => {
  const v = check({
    'features/proyectos/c.ts':
      `// import { X } from '@features/empleados/models/empleado.model';\n` +
      `/* import { Y } from '../../empleados/models/m'; */\nexport const A = 1;\n`,
  });
  assert.deepEqual(v, []);
});

test('ignora paquetes externos y rutas que salen de src/app', () => {
  const v = check({
    'features/empleados/c.ts':
      `import { Component } from '@angular/core';\nimport { environment } from '../../../environments/environment';\nexport const A = Component;\n`,
  });
  assert.deepEqual(v, []);
});

test('exige OnPush en los componentes, pero no en los tests', () => {
  const sinOnPush = `import { Component } from '@angular/core';\n@Component({ selector: 'app-x', template: '' })\nexport class X {}\n`;
  const v = check({
    'core/layout/x.ts': sinOnPush,
    'core/layout/y.ts': COMPONENT('Y'),
    'core/layout/z.spec.ts': sinOnPush,
  });
  assert.deepEqual(rules(v), ['onpush']);
  assert.equal(v[0].file, 'core/layout/x.ts');
});

test('el mensaje indica el archivo y la línea', () => {
  const v = check({ 'features/proyectos/c.ts': `\n\nimport { A } from '@features/empleados/models/m';\n` });
  assert.equal(v[0].file, 'features/proyectos/c.ts');
  assert.equal(v[0].line, 3);
});
