import type { AppContainer } from './app';
import type { AppConfig } from './config/env';
import { createPrismaClient } from './shared/database/prisma';
import type { AppLogger } from './shared/utils/logger';

/**
 * Composition Root: ÚNICO lugar que conecta los módulos con sus implementaciones concretas.
 */
export function buildContainer(config: AppConfig, _logger: AppLogger): AppContainer {
  const prisma = createPrismaClient(config);

  return {
    modules: [],
    dispose: () => prisma.$disconnect(),
  };
}
