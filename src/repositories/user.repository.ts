import type { AuditLogEntry } from '../models/domain/types';
import type { User } from '../models/domain/user';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(user: User): Promise<User>;
  logAudit(entry: AuditLogEntry): Promise<void>;
}
