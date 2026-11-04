import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { AppConfig } from './config/env';
import { registerErrorHandler, registerNotFoundHandler } from './shared/errors/error-handler';
import type { AppModule } from './shared/http/app-module';
import { authenticationPlugin } from './shared/security/auth.guard';
import type { AppLogger } from './shared/utils/logger';

export interface AppContainer {
  modules: AppModule[];
  dispose(): Promise<void>;
}

export type ContainerFactory = (logger: AppLogger) => AppContainer;

/**
 * Construye la aplicación sin abrir el puerto. Recibe la fábrica del contenedor
 * para que las pruebas web puedan inyectar módulos con repositorios en memoria.
 */
export async function buildApp(config: AppConfig, containerFactory: ContainerFactory): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.nodeEnv === 'test' ? false : { level: config.nodeEnv === 'production' ? 'info' : 'debug' },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandler(app);
  registerNotFoundHandler(app);

  const container = containerFactory(app.log);
  app.addHook('onClose', async () => container.dispose());

  await app.register(cors, { origin: config.corsOrigin, credentials: true });
  await app.register(jwt, { secret: config.jwtSecret });
  await app.register(authenticationPlugin);

  await app.register(swagger, {
    openapi: {
      info: { title: 'ECI-MyCampus API', version: '1.0.0' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    service: 'eci-mycampus-backend',
    timestamp: new Date().toISOString(),
  }));

  for (const module of container.modules) {
    await app.register(
      async (scope) => {
        registerErrorHandler(scope, module.errorMessages);
        await scope.register(module.routes);
      },
      { prefix: module.prefix },
    );
  }

  return app;
}
