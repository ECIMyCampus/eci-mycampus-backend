import { ResourceNotFoundException, UnauthorizedException } from '../../exceptions/app.exception';
import type { IPasswordHasher } from '../../models/domain/types';
import type { User } from '../../models/domain/user';
import type { IUserRepository } from '../../repositories/user.repository';
import type { IAuthValidator } from '../../validators/auth.validator';
import type { IAuthService, LoginParams } from '../auth.service';

export class AuthServiceImpl implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly validator: IAuthValidator,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async register(draftUser: User): Promise<User> {
    await this.validator.validateRegistration(draftUser.email);
    const created = await this.userRepository.create(draftUser);

    if (created.id) {
      await this.userRepository.logAudit({
        actorId: created.id,
        action: 'USER_REGISTERED',
        targetEntity: 'User',
        targetId: created.id,
        payload: { email: created.email, role: created.role },
        ipAddress: 'internal',
      }).catch(() => {
        // Auditoría no bloquea el flujo principal
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
      await this.userRepository.logAudit({
        actorId: user.id,
        action: 'USER_LOGIN',
        targetEntity: 'User',
        targetId: user.id,
        ipAddress: params.ipAddress ?? 'unknown',
      }).catch(() => {});
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
}
