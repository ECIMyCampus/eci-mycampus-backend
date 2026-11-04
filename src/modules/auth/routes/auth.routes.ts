import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AuthApi } from '../controllers/docs/auth.api';
import type { AuthController } from '../controllers/auth.controller';
import { UnauthorizedException } from '../../../shared/errors/app.exception';
import type { LoginRequestDTO, RegisterRequestDTO } from '../models/dto/request/auth.request.dto';

const requireAuth = async (request: FastifyRequest, _reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedException('Token de autenticación inválido o ausente.');
  }
};

export function authRoutes(controller: AuthController) {
  return async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post<{ Body: RegisterRequestDTO }>('/register', { schema: AuthApi.register }, controller.register);
    app.post<{ Body: LoginRequestDTO }>('/login', { schema: AuthApi.login }, controller.login);
    app.get('/me', { schema: AuthApi.me, preHandler: requireAuth }, controller.me);
  };
}
