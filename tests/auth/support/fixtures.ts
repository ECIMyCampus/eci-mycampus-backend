import type { AppLogger } from '../../../src/shared/utils/logger';
import type { AuditLogEntry, IPasswordHasher } from '../../../src/modules/auth/models/domain/types';
import { User, UserProfile, type UserProps } from '../../../src/modules/auth/models/domain/user';
import type { IUserRepository } from '../../../src/modules/auth/repositories/user.repository';

export const silentLogger: AppLogger = { info() {}, warn() {}, error() {} };

export class MockPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed_${password}`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed_${plain}`;
  }
}

export function buildUser(overrides: Partial<UserProps> = {}): User {
  const profile = new UserProfile({
    fullName: 'Estudiante Prueba',
    facultyId: 'fac-sistemas',
    academicProgram: 'Ingeniería de Sistemas',
    interests: ['Inteligencia Artificial', 'Robótica'],
    avatarUrl: null,
    isAuthorizedOrganizer: false,
    habeasDataAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  return new User({
    id: 'user-uuid-1',
    email: 'estudiante.prueba@mail.escuelaing.edu.co',
    passwordHash: 'hashed_Secret123',
    role: 'ESTUDIANTE',
    isActive: true,
    isEmailVerified: false,
    profile,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

export class InMemoryUserRepository implements IUserRepository {
  readonly users = new Map<string, User>();
  readonly auditLogs: AuditLogEntry[] = [];
  private sequence = 0;

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async create(user: User): Promise<User> {
    const id = user.id ?? `user-${++this.sequence}`;
    const saved = new User({
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.users.set(id, saved);
    return saved;
  }

  async logAudit(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push(entry);
  }
}

