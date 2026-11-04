import { User, UserProfile } from '../models/domain/user';
import type { RegisterRequestDTO } from '../models/dto/request/auth.request.dto';
import type { UserResponseDTO } from '../models/dto/response/auth.response.dto';

/**
 * Mapper de frontera HTTP (DTO <-> Domain).
 * Seguridad: rol por defecto ESTUDIANTE, activo por defecto true, id autogenerado.
 */
export class AuthMapper {
  toDomain(dto: RegisterRequestDTO, passwordHash: string): User {
    const profile = new UserProfile({
      fullName: dto.fullName,
      facultyId: dto.facultyId ?? null,
      academicProgram: dto.academicProgram ?? null,
      interests: dto.interests,
      avatarUrl: null,
      isAuthorizedOrganizer: false,
      habeasDataAcceptedAt: new Date(),
    });

    return new User({
      email: dto.email,
      passwordHash,
      role: 'ESTUDIANTE',
      isActive: true,
      isEmailVerified: false,
      profile,
    });
  }

  toResponse(user: User): UserResponseDTO {
    if (!user.id) {
      throw new Error('No se puede generar respuesta para un usuario no persistido.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      facultyId: user.facultyId,
      isAuthorizedOrganizer: user.isAuthorizedOrganizer,
      createdAt: (user.createdAt ?? new Date()).toISOString(),
    };
  }
}
