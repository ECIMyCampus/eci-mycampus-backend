import type { UserRegistration } from '../models/domain/types';
import { UserProfile, type User } from '../models/domain/user';
import type { RegisterRequestDTO } from '../models/dto/request/auth.request.dto';
import type { UserResponseDTO } from '../models/dto/response/auth.response.dto';

/**
 * Mapper de frontera HTTP (DTO <-> Domain).
 * Lista blanca: solo los campos declarados llegan al dominio; rol y estado los fija el servicio.
 */
export class AuthMapper {
  toRegistration(dto: RegisterRequestDTO): UserRegistration {
    const profile = new UserProfile({
      fullName: dto.fullName,
      facultyId: dto.facultyId ?? null,
      academicProgram: dto.academicProgram ?? null,
      interests: dto.interests,
      avatarUrl: null,
      isAuthorizedOrganizer: false,
      habeasDataAcceptedAt: new Date(),
    });

    return { email: dto.email, password: dto.password, profile };
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

