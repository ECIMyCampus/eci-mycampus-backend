import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import { registerInputSchema, loginInputSchema } from '../schemas/auth.schema';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = registerInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(422).send({
        error: 'Unprocessable Entity',
        issues: parseResult.error.format(),
      });
    }

    try {
      const result = await authService.register(parseResult.data);
      return reply.status(201).send({
        message: 'Usuario registrado exitosamente',
        user: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar usuario';
      return reply.status(409).send({ error: 'Conflict', message });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = loginInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(422).send({
        error: 'Unprocessable Entity',
        issues: parseResult.error.format(),
      });
    }

    try {
      const user = await authService.login(parseResult.data);
      // Generar JWT utilizando el plugin de Fastify
      const token = await reply.jwtSign(
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          facultyId: user.facultyId,
          isAuthorizedOrganizer: user.isAuthorizedOrganizer,
        },
        { expiresIn: '7d' }
      );

      return reply.status(200).send({
        token,
        user,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      return reply.status(401).send({ error: 'Unauthorized', message });
    }
  }
}

export const authController = new AuthController();
