import { z } from 'zod';
import { USER_ROLES } from '../../domain/enums';

export const UserProfileResponseSchema = z.object({
  fullName: z.string(),
  facultyId: z.string().nullable(),
  academicProgram: z.string().nullable(),
  interests: z.array(z.string()),
  avatarUrl: z.string().nullable(),
  isAuthorizedOrganizer: z.boolean(),
});

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
  fullName: z.string(),
  facultyId: z.string().nullable(),
  isAuthorizedOrganizer: z.boolean(),
  createdAt: z.string(),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserResponseSchema,
});

export const RegisterResponseSchema = z.object({
  message: z.string(),
  user: UserResponseSchema,
});

export type UserProfileResponseDTO = z.infer<typeof UserProfileResponseSchema>;
export type UserResponseDTO = z.infer<typeof UserResponseSchema>;
export type LoginResponseDTO = z.infer<typeof LoginResponseSchema>;
export type RegisterResponseDTO = z.infer<typeof RegisterResponseSchema>;

