export const USER_ROLES = [
  'INVITADO',
  'ESTUDIANTE',
  'DOCENTE',
  'ENTRENADOR',
  'MODERADOR',
  'ADMIN',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

