import type { UserRegistration } from '../models/domain/types';
import type { User } from '../models/domain/user';

export interface LoginParams {
  email: string;
  password: string;
  ipAddress?: string;
}

export interface IAuthService {
  register(registration: UserRegistration): Promise<User>;
  login(params: LoginParams): Promise<User>;
  getUserById(id: string): Promise<User>;
}
