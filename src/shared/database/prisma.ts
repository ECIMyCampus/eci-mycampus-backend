import { PrismaClient } from '@prisma/client';
import type { AppConfig } from '../../config/env';

export function createPrismaClient(config: Pick<AppConfig, 'databaseUrl' | 'nodeEnv'>): PrismaClient {
  return new PrismaClient({
    datasourceUrl: config.databaseUrl,
    log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}
