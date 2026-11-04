import type { User } from '../models/domain/user';

export interface IAuthValidator {
  validateRegistration(email: string): Promise<void>;
  validateUserActive(user: User): void;
}
