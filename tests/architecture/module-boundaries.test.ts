import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Hace cumplir docs/architecture/MODULAR_MONOLITH.md: un módulo solo ve de otro su index.ts,
 * shared no conoce a los módulos y el dominio no conoce infraestructura.
 */
const SRC = join(__dirname, '..', '..', 'src');
const FORBIDDEN_IN_DOMAIN = /^(fastify($|[-/])|@fastify\/|@prisma\/|prisma$|zod($|\/))/;
const FORBIDDEN_TARGETS_IN_DOMAIN = /(^|\/)repositories(\/|$)|^shared\/database(\/|$)|^config(\/|$)/;

function listSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listSources(full) : full.endsWith('.ts') ? [full] : [];
  });
}

function importsOf(source: string): string[] {
  return ts.preProcessFile(source, true, true).importedFiles.map((file) => file.fileName);
}

/** Devuelve la violación de una importación o null. `file` y el resultado son relativos a src/. */
function checkImport(file: string, specifier: string): string | null {
  const ownModule = /^modules\/([^/]+)\//.exec(file)?.[1];
  const isDomain = /^modules\/[^/]+\/models\/domain\//.test(file);

  if (!specifier.startsWith('.')) {
    return isDomain && FORBIDDEN_IN_DOMAIN.test(specifier)
      ? `${file}: el dominio no puede importar ${specifier}`
      : null;
  }

  const target = posix.normalize(posix.join(posix.dirname(file), specifier));

  if (isDomain && FORBIDDEN_TARGETS_IN_DOMAIN.test(target)) {
    return `${file}: el dominio no puede importar infraestructura (${target})`;
  }

  if (file.startsWith('shared/') && /^(modules(\/|$)|app$|container$)/.test(target)) {
    return `${file}: shared no puede importar módulos ni la aplicación (${target})`;
  }

  if (ownModule && /^config(\/|$)/.test(target)) {
    return `${file}: un módulo recibe su configuración por constructor (${target})`;
  }

  const targetModule = /^modules\/([^/]+)(?:\/|$)/.exec(target)?.[1];
  if (ownModule && targetModule && targetModule !== ownModule) {
    const isPublicApi = target === `modules/${targetModule}` || target === `modules/${targetModule}/index`;
    if (!isPublicApi) {
      return `${file}: solo se puede importar el index.ts de ${targetModule} (${target})`;
    }
  }

  if (ownModule && (target === 'app' || target === 'container')) {
    return `${file}: un módulo no puede importar ${target}`;
  }

  return null;
}

describe('Límites entre módulos', () => {
  it('el código actual respeta todas las reglas', () => {
    const violations = listSources(SRC).flatMap((full) => {
      const file = relative(SRC, full).split(sep).join('/');
      return importsOf(readFileSync(full, 'utf8'))
        .map((specifier) => checkImport(file, specifier))
        .filter((violation): violation is string => violation !== null);
    });

    expect(violations).toEqual([]);
  });

  it('existen los tres módulos con su única API pública', () => {
    for (const name of ['auth', 'campus', 'events']) {
      expect(existsSync(join(SRC, 'modules', name, 'index.ts')), name).toBe(true);
    }
  });

  describe('detecta importaciones ilegales', () => {
    it.each([
      ['modules/events/services/a.ts', '../../auth/services/auth.service'],
      ['modules/events/a.ts', '../campus/repositories/campus.repository'],
      ['shared/errors/a.ts', '../../modules/auth'],
      ['shared/errors/a.ts', '../../modules'],
      ['shared/errors/a.ts', '../../container'],
      ['modules/auth/a.ts', '../../config/env'],
      ['modules/auth/models/domain/a.ts', 'fastify-plugin'],
      ['modules/auth/models/domain/a.ts', 'zod/v4'],
      ['modules/auth/models/domain/a.ts', '../../repositories/prisma/x'],
      ['modules/auth/models/domain/a.ts', '../../../../shared/database/prisma'],
      ['modules/auth/a.ts', '../../container'],
      ['modules/auth/models/domain/a.ts', 'fastify'],
      ['modules/events/models/domain/state/a.ts', '@prisma/client'],
    ])('%s -> %s', (file, specifier) => {
      expect(checkImport(file, specifier)).not.toBeNull();
    });
  });

  it.each([
    ['import a from "../../auth/services/x";'],
    ["export { b } from '../../auth/services/x';"],
    ["const c = require('../../auth/services/x');"],
    ["const d = await import('../../auth/services/x');"],
    ["import {\n  e,\n} from '../../auth/services/x';"],
  ])('reconoce la forma de importación: %s', (source) => {
    expect(importsOf(source)).toEqual(['../../auth/services/x']);
  });

  it('no confunde comentarios con importaciones', () => {
    expect(importsOf("// import x from '../../auth/services/x';\n")).toEqual([]);
  });

  describe('permite importaciones legales', () => {
    it.each([
      ['modules/events/services/a.ts', '../../auth'],
      ['modules/events/a.ts', '../auth/index'],
      ['modules/events/services/a.ts', '../models/domain/event'],
      ['modules/events/a.ts', '../../shared/errors/app.exception'],
      ['modules/auth/models/domain/enums.ts', '../../../../shared/security/identity'],
      ['modules/events/models/domain/state/a.ts', '../../../../../shared/errors/app.exception'],
      ['modules/auth/controllers/a.ts', 'fastify'],
      ['container.ts', './modules/auth'],
    ])('%s -> %s', (file, specifier) => {
      expect(checkImport(file, specifier)).toBeNull();
    });
  });
});
