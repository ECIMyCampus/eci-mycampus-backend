import type { User } from '../models/domain/user';

export interface LoginParams {
  email: string;
  password: string;
  ipAddress?: string;
}

export interface IAuthService {
  register(draftUser: User): Promise<User>;
  login(params: LoginParams): Promise<User>;
  getUserById(id: string): Promise<User>;
}
