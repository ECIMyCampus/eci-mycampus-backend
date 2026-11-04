import { ConflictException, UnauthorizedException } from '../../../../shared/errors/app.exception';
import type { User } from '../../models/domain/user';
import type { IUserRepository } from '../../repositories/user.repository';
import type { IAuthValidator } from '../auth.validator';

export class AuthValidatorImpl implements IAuthValidator {
  constructor(private readonly userRepository: IUserRepository) {}

  async validateRegistration(email: string): Promise<void> {
    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      throw new ConflictException('Ya existe una cuenta registrada con este correo electrónico institucional.');
    }
  }

  validateUserActive(user: User): void {
    if (!user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva.');
    }
  }
}

