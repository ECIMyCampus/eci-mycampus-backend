import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthMapper } from '../mappers/auth.mapper';
import type { IPasswordHasher } from '../models/domain/types';
import type { LoginRequestDTO, RegisterRequestDTO } from '../models/dto/request/auth.request.dto';
import type { IAuthService } from '../services/auth.service';

export class AuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly mapper: AuthMapper,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  register = async (request: FastifyRequest<{ Body: RegisterRequestDTO }>, reply: FastifyReply) => {
    const passwordHash = await this.passwordHasher.hash(request.body.password);
    const draftUser = this.mapper.toDomain(request.body, passwordHash);
    const created = await this.authService.register(draftUser);

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

    const token = await reply.jwtSign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        facultyId: user.facultyId,
        isAuthorizedOrganizer: user.isAuthorizedOrganizer,
        fullName: user.fullName,
      },
      { expiresIn: '7d' },
    );

    return reply.status(200).send({
      token,
      user: this.mapper.toResponse(user),
    });
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    const actor = (request as unknown as { user: { id: string } }).user;
    const user = await this.authService.getUserById(actor.id);
    return reply.status(200).send(this.mapper.toResponse(user));
  };
}
