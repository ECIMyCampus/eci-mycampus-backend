import type { AppContainer } from './app';
import type { AppConfig } from './config/env';
import { createAuthModule } from './modules/auth';
import { createCampusModule } from './modules/campus';
import { createEventsModule } from './modules/events';
import { createPrismaClient } from './shared/database/prisma';
import type { AppLogger } from './shared/utils/logger';

/**
 * Composition Root: ÚNICO lugar que conecta los módulos con sus implementaciones concretas.
 */
export function buildContainer(config: AppConfig, logger: AppLogger): AppContainer {
  const prisma = createPrismaClient(config);

  return {
    modules: [
      createAuthModule(prisma, logger),
      createCampusModule(prisma),
      createEventsModule({
        prisma,
        logger,
        resendApiKey: config.resendApiKey,
        emailFrom: config.emailFrom,
      }),
    ],
    checkReadiness: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
    dispose: () => prisma.$disconnect(),
  };
}
