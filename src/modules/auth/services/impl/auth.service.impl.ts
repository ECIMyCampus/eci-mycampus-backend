import { ResourceNotFoundException, UnauthorizedException } from '../../../../shared/errors/app.exception';
import type { AppLogger } from '../../../../shared/utils/logger';
import type { AuditLogEntry, IPasswordHasher, UserRegistration } from '../../models/domain/types';
import { User } from '../../models/domain/user';
import type { IUserRepository } from '../../repositories/user.repository';
import type { IAuthValidator } from '../../validators/auth.validator';
import type { IAuthService, LoginParams } from '../auth.service';

export class AuthServiceImpl implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly validator: IAuthValidator,
    private readonly passwordHasher: IPasswordHasher,
    private readonly logger: AppLogger,
  ) {}

  async register(registration: UserRegistration): Promise<User> {
    await this.validator.validateRegistration(registration.email);
    const created = await this.userRepository.create(
      new User({
        email: registration.email,
        passwordHash: await this.passwordHasher.hash(registration.password),
        role: 'ESTUDIANTE',
        isActive: true,
        isEmailVerified: false,
        profile: registration.profile,
      }),
    );

    if (created.id) {
      await this.audit({
        actorId: created.id,
        action: 'USER_REGISTERED',
        targetEntity: 'User',
        targetId: created.id,
        payload: { email: created.email, role: created.role },
        ipAddress: 'internal',
      });
    }

    return created;
  }

  async login(params: LoginParams): Promise<User> {
    const user = await this.userRepository.findByEmail(params.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva.');
    }

    this.validator.validateUserActive(user);

    const isValid = await this.passwordHasher.verify(user.passwordHash, params.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva.');
    }

    if (user.id) {
      await this.audit({
        actorId: user.id,
        action: 'USER_LOGIN',
        targetEntity: 'User',
        targetId: user.id,
        ipAddress: params.ipAddress ?? 'unknown',
      });
    }

    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ResourceNotFoundException(`Usuario con ID '${id}' no encontrado.`);
    }
    return user;
  }

  /** La auditoría no bloquea el flujo principal, pero su fallo debe quedar registrado. */
  private async audit(entry: AuditLogEntry): Promise<void> {
    try {
      await this.userRepository.logAudit(entry);
    } catch (err) {
      this.logger.error({ err, action: entry.action, targetId: entry.targetId }, 'No se pudo registrar la auditoría');
    }
  }
}

