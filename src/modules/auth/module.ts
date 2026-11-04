import type { PrismaClient } from '@prisma/client';
import type { ErrorMessages } from '../../shared/errors/error-handler';
import type { AppModule } from '../../shared/http/app-module';
import { AuthController } from './controllers/auth.controller';
import { Argon2PasswordHasher } from './lib/password';
import { AuthMapper } from './mappers/auth.mapper';
import { UserEntityMapper } from './mappers/user-entity.mapper';
import type { IPasswordHasher } from './models/domain/types';
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
  passwordHasher: IPasswordHasher;
}

/** Publica la API HTTP del módulo a partir de sus dependencias (las pruebas inyectan dobles). */
export function authHttpModule({ authService, authMapper, passwordHasher }: AuthHttpDependencies): AppModule {
  return {
    prefix: '/api/v1/auth',
    routes: authRoutes(new AuthController(authService, authMapper, passwordHasher)),
    errorMessages: ERROR_MESSAGES,
  };
}

/** Conecta el módulo con sus implementaciones reales. */
export function createAuthModule(prisma: PrismaClient): AppModule {
  const repository = new PrismaUserRepository(prisma, new UserEntityMapper());
  const passwordHasher = new Argon2PasswordHasher();
  return authHttpModule({
    authService: new AuthServiceImpl(repository, new AuthValidatorImpl(repository), passwordHasher),
    authMapper: new AuthMapper(),
    passwordHasher,
  });
}
