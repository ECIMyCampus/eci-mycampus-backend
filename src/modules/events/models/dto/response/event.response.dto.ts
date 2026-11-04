import { z } from 'zod';
import {
  ACCESS_TYPES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  REGISTRATION_STATUSES,
  REPORT_STATUSES,
} from '../../domain/enums';

/**
 * Contratos de salida. Se definen con Zod para:
 *  1. Documentarlos automáticamente en OpenAPI (/docs).
 *  2. Que Fastify serialice SOLO los campos declarados (nunca se filtra la entidad Prisma).
 */
export const EventResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(EVENT_CATEGORIES),
  facultyId: z.string().nullable(),
  organizerId: z.string(),
  organizerName: z.string(),
  buildingId: z.string(),
  specificLocation: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  originalEndTime: z.string(),
  status: z.enum(EVENT_STATUSES),
  accessType: z.enum(ACCESS_TYPES),
  price: z.string(),
  isPublic: z.boolean(),
  requiresRegistration: z.boolean(),
  maxCapacity: z.number().int().nullable(),
  availableCapacity: z.number().int().nullable(),
  imageUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  temporalStatus: z.enum(['EN_CURSO', 'PROXIMO', 'FINALIZADO']),
  isLive: z.boolean(),
});

export const RadarEventResponseSchema = EventResponseSchema.extend({
  registrationsCount: z.number().int(),
  favoritesCount: z.number().int(),
});

export const RegistrationResponseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  status: z.enum(REGISTRATION_STATUSES),
  registeredAt: z.string(),
});

export const EventReportResponseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  reason: z.string(),
  description: z.string().nullable(),
  status: z.enum(REPORT_STATUSES),
  createdAt: z.string(),
});

export type EventResponseDTO = z.infer<typeof EventResponseSchema>;
export type RadarEventResponseDTO = z.infer<typeof RadarEventResponseSchema>;
export type RegistrationResponseDTO = z.infer<typeof RegistrationResponseSchema>;
export type EventReportResponseDTO = z.infer<typeof EventReportResponseSchema>;

