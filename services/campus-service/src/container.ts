import type { AppConfig } from './config/env';
import { createPrismaClient } from './lib/prisma';
import { CampusMapper } from './mappers/campus.mapper';
import { CampusEntityMapper } from './mappers/campus-entity.mapper';
import { PrismaCampusRepository } from './repositories/prisma/prisma-campus.repository';
import type { ICampusService } from './services/campus.service';
import { CampusServiceImpl } from './services/impl/campus.service.impl';

export interface AppContainer {
  campusService: ICampusService;
  campusMapper: CampusMapper;
  dispose(): Promise<void>;
}

export function buildContainer(config: AppConfig): AppContainer {
  const prisma = createPrismaClient(config);
  const entityMapper = new CampusEntityMapper();
  const campusRepository = new PrismaCampusRepository(prisma, entityMapper);
  const campusService = new CampusServiceImpl(campusRepository);
  const campusMapper = new CampusMapper();

  return {
    campusService,
    campusMapper,
    dispose: () => prisma.$disconnect(),
  };
}

