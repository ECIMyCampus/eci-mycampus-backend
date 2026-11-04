import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { AppConfig } from './config/env';
import type { AppContainer } from './container';
import { CampusController } from './controllers/campus.controller';
import { registerGlobalErrorHandler } from './exceptions/global-error-handler';
import { campusRoutes } from './routes/campus.routes';

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

  await app.register(swagger, {
    openapi: {
      info: { title: 'ECI-MyCampus · Campus Service', version: '1.0.0' },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    service: 'campus-service',
    timestamp: new Date().toISOString(),
  }));

  const controller = new CampusController(container.campusService, container.campusMapper);
  await app.register(campusRoutes(controller), { prefix: '/api/v1/campus' });

  return app;
}

