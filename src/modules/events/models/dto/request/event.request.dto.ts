import { z } from 'zod';
import { ACCESS_TYPES, EVENT_CATEGORIES } from '../../domain/enums';

const ISO_DATETIME = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/;

/**
 * Fecha ISO-8601 con zona, con segundos y dos puntos del offset opcionales.
 * Zod 4 exige ambos en `datetime()`; esto conserva lo que el contrato ya aceptaba.
 */
const isoDatetime = (message: string) =>
  z
    .string()
    .meta({ format: 'date-time' })
    .refine((value) => {
      const match = ISO_DATETIME.exec(value);
      return (
        match !== null && z.iso.date().safeParse(match[1]).success && !Number.isNaN(new Date(value).getTime())
      );
    }, message);

/**
 * Nivel 1 de validación (frontera HTTP): formato, nulidad y rangos simples.
 * Las reglas que dependen del estado persistido viven en IEventValidator.
 * `.strict()` rechaza campos no declarados (protección contra Mass Assignment).
 */
export const EventCreationRequestSchema = z
  .object({
    title: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres').max(150),
    description: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres').max(5000),
    category: z.enum(EVENT_CATEGORIES),
    facultyId: z.string().uuid('Identificador de facultad no válido').optional(),
    buildingId: z.string().trim().min(1, 'El edificio es obligatorio'),
    specificLocation: z.string().trim().min(2, 'La ubicación específica (salón/piso) es obligatoria'),
    startTime: isoDatetime('Fecha de inicio no válida (ISO-8601)'),
    endTime: isoDatetime('Fecha de finalización no válida (ISO-8601)'),
    accessType: z.enum(ACCESS_TYPES).default('LIBRE'),
    isPublic: z.boolean().default(true),
    requiresRegistration: z.boolean().default(false),
    maxCapacity: z.number().int().positive().max(100000).optional(),
    price: z.number().nonnegative().max(100_000_000).default(0),
    imageUrl: z.string().url('URL de imagen no válida').optional(),
  })
  .strict();

export const RadarFilterRequestSchema = z.object({
  facultyId: z.string().uuid('Identificador de facultad no válido').optional(),
  category: z.enum(EVENT_CATEGORIES).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const EventIdParamsSchema = z.object({
  id: z.string().uuid('ID de evento no válido'),
});

export const EventRejectionRequestSchema = z
  .object({
    reason: z.string().trim().min(10, 'El motivo de rechazo debe tener al menos 10 caracteres').max(500),
  })
  .strict();

export const EventReportCreationRequestSchema = z
  .object({
    reason: z.string().trim().min(5, 'El motivo de la denuncia debe tener al menos 5 caracteres').max(200),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export type EventCreationRequestDTO = z.infer<typeof EventCreationRequestSchema>;
export type RadarFilterRequestDTO = z.infer<typeof RadarFilterRequestSchema>;
export type EventIdParamsDTO = z.infer<typeof EventIdParamsSchema>;
export type EventRejectionRequestDTO = z.infer<typeof EventRejectionRequestSchema>;
export type EventReportCreationRequestDTO = z.infer<typeof EventReportCreationRequestSchema>;

