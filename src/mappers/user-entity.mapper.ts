import type { User as UserEntity, UserProfile as UserProfileEntity } from '@prisma/client';
import { User, UserProfile } from '../models/domain/user';

type UserWithProfileEntity = UserEntity & {
  profile: UserProfileEntity | null;
};

/**
 * Mapper de persistencia (Domain <-> Prisma Entity).
 */
export class UserEntityMapper {
  toDomain(entity: UserWithProfileEntity): User {
    const profile = entity.profile
      ? new UserProfile({
          userId: entity.profile.userId,
          fullName: entity.profile.fullName,
          facultyId: entity.profile.facultyId,
          academicProgram: entity.profile.academicProgram,
          interests: entity.profile.interests,
          avatarUrl: entity.profile.avatarUrl,
          isAuthorizedOrganizer: entity.profile.isAuthorizedOrganizer,
          habeasDataAcceptedAt: entity.profile.habeasDataAcceptedAt,
        })
      : null;

    return new User({
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role,
      isActive: entity.isActive,
      isEmailVerified: entity.isEmailVerified,
      profile,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}

