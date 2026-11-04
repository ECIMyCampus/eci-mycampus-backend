import { z } from 'zod';

export const USER_ROLES = ['INVITADO', 'ESTUDIANTE', 'DOCENTE', 'ENTRENADOR', 'MODERADOR', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Contrato del JWT: el módulo auth lo firma y el guard lo valida.
 * Es el único acoplamiento de identidad entre módulos.
 */
export const JwtClaimsSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().nullish(),
  fullName: z.string().nullish(),
  role: z.enum(USER_ROLES),
  facultyId: z.string().nullish(),
  isAuthorizedOrganizer: z.boolean().nullish(),
});

export type JwtClaims = z.infer<typeof JwtClaimsSchema>;

/** Usuario autenticado tal como lo entiende el dominio (independiente del JWT). */
export interface Actor {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  facultyId: string | null;
  isAuthorizedOrganizer: boolean;
}
