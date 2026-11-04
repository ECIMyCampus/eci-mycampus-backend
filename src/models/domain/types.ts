import type { UserRole } from './enums';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  facultyId: string | null;
  isAuthorizedOrganizer: boolean;
}

export interface AuditLogEntry {
  actorId: string;
  action: string;
  targetEntity: string;
  targetId: string;
  payload?: Record<string, unknown>;
  ipAddress: string;
}
