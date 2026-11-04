import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { AppConfig } from './config/env';
import type { AppContainer } from './container';
import { EventsController } from './controllers/events.controller';
import { registerGlobalErrorHandler } from './exceptions/global-error-handler';
import { EventMapper } from './mappers/event.mapper';
import { eventsRoutes } from './routes/events.routes';
import { authenticationPlugin } from './security/auth.guard';
import type { AppLogger } from './utils/logger';

export type ContainerFactory = (logger: AppLogger) => AppContainer;

/**
 * Construye la aplicación sin abrir el puerto. Recibe la fábrica del contenedor
 * para que las pruebas web puedan inyectar servicios falsos.
 */
export async function buildApp(config: AppConfig, containerFactory: ContainerFactory): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.nodeEnv === 'test' ? false : { level: config.nodeEnv === 'production' ? 'info' : 'debug' },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerGlobalErrorHandler(app);

  const container = containerFactory(app.log);
  app.addHook('onClose', async () => container.dispose());

  await app.register(cors, { origin: config.corsOrigin, credentials: true });
  await app.register(jwt, { secret: config.jwtSecret });
  await app.register(authenticationPlugin);

  await app.register(swagger, {
    openapi: {
      info: { title: 'ECI-MyCampus · Events Service', version: '1.0.0' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    service: 'events-service',
    timestamp: new Date().toISOString(),
  }));

  const controller = new EventsController(container.eventsService, new EventMapper());
  await app.register(eventsRoutes(controller), { prefix: '/api/v1/events' });

  return app;
}

