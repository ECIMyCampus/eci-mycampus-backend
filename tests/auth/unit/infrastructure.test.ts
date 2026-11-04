import { describe, expect, it } from 'vitest';
import { UserEntityMapper } from '../../../src/modules/auth/mappers/user-entity.mapper';

describe('UserEntityMapper (Domain <-> Prisma)', () => {
  const mapper = new UserEntityMapper();

  it('mapea correctamente entidad Prisma con profile a modelo de dominio', () => {
    // Arrange
    const entity = {
      id: 'uuid-1',
      email: 'test@mail.escuelaing.edu.co',
      passwordHash: 'hash',
      isEmailVerified: true,
      role: 'ESTUDIANTE' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        userId: 'uuid-1',
        fullName: 'Test User',
        facultyId: 'fac-1',
        academicProgram: 'Ingeniería',
        interests: ['Tech'],
        avatarUrl: null,
        isAuthorizedOrganizer: true,
        habeasDataAcceptedAt: new Date(),
      },
    };

    // Act
    const domain = mapper.toDomain(entity);

    // Assert
    expect(domain.id).toBe('uuid-1');
    expect(domain.fullName).toBe('Test User');
    expect(domain.isAuthorizedOrganizer).toBe(true);
  });

  it('mapea correctamente entidad Prisma sin profile', () => {
    // Arrange
    const entity = {
      id: 'uuid-2',
      email: 'sinperfil@mail.escuelaing.edu.co',
      passwordHash: 'hash',
      isEmailVerified: false,
      role: 'ESTUDIANTE' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: null,
    };

    // Act
    const domain = mapper.toDomain(entity);

    // Assert
    expect(domain.fullName).toBe('');
    expect(domain.facultyId).toBeNull();
    expect(domain.isAuthorizedOrganizer).toBe(false);
  });
});

import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ResourceNotFoundException,
  ConflictException,
  BusinessRuleException,
} from '../../../src/shared/errors/app.exception';

describe('AppException hierarchy', () => {
  it('instancia correctamente cada subclase semántica con su código HTTP', () => {
    expect(new BadRequestException().statusCode).toBe(400);
    expect(new UnauthorizedException().statusCode).toBe(401);
    expect(new ForbiddenException().statusCode).toBe(403);
    expect(new ResourceNotFoundException('no').statusCode).toBe(404);
    expect(new ConflictException('conflict').statusCode).toBe(409);
    expect(new BusinessRuleException('rule').statusCode).toBe(422);
  });
});
