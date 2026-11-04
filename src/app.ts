import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { AppConfig } from './config/env';
import type { AppContainer } from './container';
import { AuthController } from './controllers/auth.controller';
import { registerGlobalErrorHandler } from './exceptions/global-error-handler';
import { authRoutes } from './routes/auth.routes';

export type ContainerFactory = () => AppContainer;

export async function buildApp(config: AppConfig, containerFactory: ContainerFactory): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.nodeEnv === 'test' ? false : { level: config.nodeEnv === 'production' ? 'info' : 'debug' },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerGlobalErrorHandler(app);

  const container = containerFactory();
  app.addHook('onClose', async () => container.dispose());

  await app.register(cors, { origin: config.corsOrigin, credentials: true });
  await app.register(jwt, { secret: config.jwtSecret });

  await app.register(swagger, {
    openapi: {
      info: { title: 'ECI-MyCampus · Auth Service', version: '1.0.0' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  }));

  const controller = new AuthController(container.authService, container.authMapper, container.passwordHasher);
  await app.register(authRoutes(controller), { prefix: '/api/v1/auth' });

  return app;
}
