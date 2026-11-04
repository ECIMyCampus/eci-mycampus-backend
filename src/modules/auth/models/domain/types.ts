import type { UserRole } from './enums';
import type { UserProfile } from './user';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

/** Datos de un registro nuevo, antes de hashear la contraseña. */
export interface UserRegistration {
  email: string;
  password: string;
  profile: UserProfile;
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

