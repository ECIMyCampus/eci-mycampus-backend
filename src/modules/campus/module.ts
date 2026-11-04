import type { PrismaClient } from '@prisma/client';
import type { ErrorMessages } from '../../shared/errors/error-handler';
import type { AppModule } from '../../shared/http/app-module';
import { CampusController } from './controllers/campus.controller';
import { CampusMapper } from './mappers/campus.mapper';
import { CampusEntityMapper } from './mappers/campus-entity.mapper';
import { PrismaCampusRepository } from './repositories/prisma/prisma-campus.repository';
import { campusRoutes } from './routes/campus.routes';
import type { ICampusService } from './services/campus.service';
import { CampusServiceImpl } from './services/impl/campus.service.impl';

const ERROR_MESSAGES: ErrorMessages = {
  validation: 'La solicitud contiene parámetros inválidos.',
  serialization: 'Ocurrió un error inesperado al procesar la respuesta.',
  uniqueConflict: 'El recurso ya existe con ese código identificador.',
  recordNotFound: 'El registro solicitado no existe.',
};

export interface CampusHttpDependencies {
  campusService: ICampusService;
  campusMapper: CampusMapper;
}

/** Publica la API HTTP del módulo a partir de sus dependencias (las pruebas inyectan dobles). */
export function campusHttpModule({ campusService, campusMapper }: CampusHttpDependencies): AppModule {
  return {
    prefix: '/api/v1/campus',
    routes: campusRoutes(new CampusController(campusService, campusMapper)),
    errorMessages: ERROR_MESSAGES,
  };
}

/** Conecta el módulo con sus implementaciones reales. */
export function createCampusModule(prisma: PrismaClient): AppModule {
  const repository = new PrismaCampusRepository(prisma, new CampusEntityMapper());
  return campusHttpModule({
    campusService: new CampusServiceImpl(repository),
    campusMapper: new CampusMapper(),
  });
}
