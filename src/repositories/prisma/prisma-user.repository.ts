import type { Prisma, PrismaClient } from '@prisma/client';
import { UserEntityMapper } from '../../mappers/user-entity.mapper';
import type { AuditLogEntry } from '../../models/domain/types';
import type { User } from '../../models/domain/user';
import type { IUserRepository } from '../user.repository';

export class PrismaUserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly entityMapper: UserEntityMapper,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
    return entity ? this.entityMapper.toDomain(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    return entity ? this.entityMapper.toDomain(entity) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async create(user: User): Promise<User> {
    const createInput: Prisma.UserCreateInput = {
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    };

    if (user.profile) {
      createInput.profile = {
        create: {
          fullName: user.profile.fullName,
          facultyId: user.profile.facultyId,
          academicProgram: user.profile.academicProgram,
          interests: user.profile.interests,
          avatarUrl: user.profile.avatarUrl,
          isAuthorizedOrganizer: user.profile.isAuthorizedOrganizer,
          habeasDataAcceptedAt: user.profile.habeasDataAcceptedAt,
        },
      };
    }

    const created = await this.prisma.user.create({
      data: createInput,
      include: { profile: true },
    });

    return this.entityMapper.toDomain(created);
  }

  async logAudit(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetEntity: entry.targetEntity,
        targetId: entry.targetId,
        payload: (entry.payload as Prisma.InputJsonValue) ?? undefined,
        ipAddress: entry.ipAddress,
      },
    });
  }
}
