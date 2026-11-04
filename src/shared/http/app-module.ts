import type { FastifyInstance } from 'fastify';
import type { ErrorMessages } from '../errors/error-handler';

/** Lo que un módulo entrega a la aplicación para publicar su API HTTP. */
export interface AppModule {
  prefix: string;
  routes: (fastify: FastifyInstance) => Promise<void>;
  errorMessages: ErrorMessages;
}
