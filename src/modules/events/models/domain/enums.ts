/**
 * Enums de dominio. Se declaran aquí (y no se importan de @prisma/client)
 * para que el núcleo de negocio no dependa de la capa de persistencia.
 * El EventEntityMapper es el responsable de traducirlos.
 */
export const EVENT_CATEGORIES = [
  'ACADEMICO',
  'DEPORTIVO',
  'CULTURAL',
  'ESTUDIANTIL',
  'INSTITUCIONAL',
  'BIENESTAR',
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_STATUSES = [
  'BORRADOR',
  'PENDIENTE_APROBACION',
  'PUBLICADO',
  'RECHAZADO',
  'CANCELADO',
  'ARCHIVADO',
  'REUBICACION_LOGISTICA_PENDIENTE',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ACCESS_TYPES = ['LIBRE', 'REGISTRO_PREVIO', 'EXCLUSIVO_FACULTAD'] as const;
export type AccessType = (typeof ACCESS_TYPES)[number];

export const REGISTRATION_STATUSES = ['CONFIRMADA', 'CANCELADA'] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REPORT_STATUSES = ['RECIBIDO', 'EN_REVISION', 'RESUELTO', 'DESESTIMADO'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type TemporalStatus = 'EN_CURSO' | 'PROXIMO' | 'FINALIZADO';

export const USER_ROLES = ['INVITADO', 'ESTUDIANTE', 'DOCENTE', 'ENTRENADOR', 'MODERADOR', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

