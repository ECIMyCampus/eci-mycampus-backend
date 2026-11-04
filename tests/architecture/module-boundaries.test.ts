import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Hace cumplir docs/architecture/MODULAR_MONOLITH.md: un módulo solo ve de otro su index.ts,
 * shared no conoce a los módulos y el dominio no conoce infraestructura.
 */
const SRC = join(__dirname, '..', '..', 'src');
const FORBIDDEN_IN_DOMAIN = ['fastify', '@prisma/client', 'zod'];

function listSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listSources(full) : full.endsWith('.ts') ? [full] : [];
  });
}

function importsOf(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s+'([^']+)'/g)].map((match) => match[1]!);
}

/** Devuelve la violación de una importación o null. `file` y el resultado son relativos a src/. */
function checkImport(file: string, specifier: string): string | null {
  const ownModule = /^modules\/([^/]+)\//.exec(file)?.[1];

  if (!specifier.startsWith('.')) {
    const isDomain = /^modules\/[^/]+\/models\/domain\//.test(file);
    return isDomain && FORBIDDEN_IN_DOMAIN.includes(specifier)
      ? `${file}: el dominio no puede importar ${specifier}`
      : null;
  }

  const target = posix.normalize(posix.join(posix.dirname(file), specifier));

  if (file.startsWith('shared/') && target.startsWith('modules/')) {
    return `${file}: shared no puede importar módulos (${target})`;
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
      ['modules/auth/a.ts', '../../container'],
      ['modules/auth/models/domain/a.ts', 'fastify'],
      ['modules/events/models/domain/state/a.ts', '@prisma/client'],
    ])('%s -> %s', (file, specifier) => {
      expect(checkImport(file, specifier)).not.toBeNull();
    });
  });

  describe('permite importaciones legales', () => {
    it.each([
      ['modules/events/services/a.ts', '../../auth'],
      ['modules/events/a.ts', '../auth/index'],
      ['modules/events/services/a.ts', '../models/domain/event'],
      ['modules/events/a.ts', '../../shared/errors/app.exception'],
      ['modules/auth/models/domain/enums.ts', '../../../../shared/security/identity'],
      ['modules/auth/controllers/a.ts', 'fastify'],
      ['container.ts', './modules/auth'],
    ])('%s -> %s', (file, specifier) => {
      expect(checkImport(file, specifier)).toBeNull();
    });
  });
});
