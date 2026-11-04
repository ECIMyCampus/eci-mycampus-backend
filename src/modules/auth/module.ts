import type { PrismaClient } from '@prisma/client';
import type { ErrorMessages } from '../../shared/errors/error-handler';
import type { AppModule } from '../../shared/http/app-module';
import type { AppLogger } from '../../shared/utils/logger';
import { AuthController } from './controllers/auth.controller';
import { Argon2PasswordHasher } from './adapters/impl/argon2-password-hasher';
import { AuthMapper } from './mappers/auth.mapper';
import { UserEntityMapper } from './mappers/user-entity.mapper';
import { PrismaUserRepository } from './repositories/prisma/prisma-user.repository';
import { authRoutes } from './routes/auth.routes';
import type { IAuthService } from './services/auth.service';
import { AuthServiceImpl } from './services/impl/auth.service.impl';
import { AuthValidatorImpl } from './validators/impl/auth.validator.impl';

const ERROR_MESSAGES: ErrorMessages = {
  validation: 'La solicitud contiene datos inválidos.',
  serialization: 'Ocurrió un error inesperado al procesar la respuesta.',
  uniqueConflict: 'El correo electrónico ya se encuentra registrado.',
  recordNotFound: 'El registro solicitado no existe.',
};

export interface AuthHttpDependencies {
  authService: IAuthService;
  authMapper: AuthMapper;
}

/** Publica la API HTTP del módulo a partir de sus dependencias (las pruebas inyectan dobles). */
export function authHttpModule({ authService, authMapper }: AuthHttpDependencies): AppModule {
  return {
    prefix: '/api/v1/auth',
    routes: authRoutes(new AuthController(authService, authMapper)),
    errorMessages: ERROR_MESSAGES,
  };
}

/** Conecta el módulo con sus implementaciones reales. */
export function createAuthModule(prisma: PrismaClient, logger: AppLogger): AppModule {
  const repository = new PrismaUserRepository(prisma, new UserEntityMapper());
  return authHttpModule({
    authService: new AuthServiceImpl(
      repository,
      new AuthValidatorImpl(repository),
      new Argon2PasswordHasher(),
      logger,
    ),
    authMapper: new AuthMapper(),
  });
}
