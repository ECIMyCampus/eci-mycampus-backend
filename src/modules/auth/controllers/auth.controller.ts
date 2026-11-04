import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthMapper } from '../mappers/auth.mapper';
import type { LoginRequestDTO, RegisterRequestDTO } from '../models/dto/request/auth.request.dto';
import { currentActor } from '../../../shared/security/auth.guard';
import type { JwtClaims } from '../../../shared/security/identity';
import type { IAuthService } from '../services/auth.service';

export class AuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly mapper: AuthMapper,
  ) {}

  register = async (request: FastifyRequest<{ Body: RegisterRequestDTO }>, reply: FastifyReply) => {
    const created = await this.authService.register(this.mapper.toRegistration(request.body));

    return reply.status(201).send({
      message: 'Usuario registrado exitosamente',
      user: this.mapper.toResponse(created),
    });
  };

  login = async (request: FastifyRequest<{ Body: LoginRequestDTO }>, reply: FastifyReply) => {
    const user = await this.authService.login({
      email: request.body.email,
      password: request.body.password,
      ipAddress: request.ip,
    });

    const claims: JwtClaims = {
      id: user.id!,
      email: user.email,
      role: user.role,
      facultyId: user.facultyId,
      isAuthorizedOrganizer: user.isAuthorizedOrganizer,
      fullName: user.fullName,
    };
    const token = await reply.jwtSign(claims, { expiresIn: '7d' });

    return reply.status(200).send({
      token,
      user: this.mapper.toResponse(user),
    });
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await this.authService.getUserById(currentActor(request).id);
    return reply.status(200).send(this.mapper.toResponse(user));
  };
}
