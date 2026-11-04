import type { AppConfig } from './config/env';
import { Argon2PasswordHasher } from './lib/password';
import { createPrismaClient } from './lib/prisma';
import { AuthMapper } from './mappers/auth.mapper';
import { UserEntityMapper } from './mappers/user-entity.mapper';
import type { IPasswordHasher } from './models/domain/types';
import { PrismaUserRepository } from './repositories/prisma/prisma-user.repository';
import type { IAuthService } from './services/auth.service';
import { AuthServiceImpl } from './services/impl/auth.service.impl';
import { AuthValidatorImpl } from './validators/impl/auth.validator.impl';

export interface AppContainer {
  authService: IAuthService;
  authMapper: AuthMapper;
  passwordHasher: IPasswordHasher;
  dispose(): Promise<void>;
}

export function buildContainer(config: AppConfig): AppContainer {
  const prisma = createPrismaClient(config);
  const entityMapper = new UserEntityMapper();
  const userRepository = new PrismaUserRepository(prisma, entityMapper);
  const validator = new AuthValidatorImpl(userRepository);
  const passwordHasher = new Argon2PasswordHasher();
  const authMapper = new AuthMapper();

  const authService = new AuthServiceImpl(userRepository, validator, passwordHasher);

  return {
    authService,
    authMapper,
    passwordHasher,
    dispose: () => prisma.$disconnect(),
  };
}

