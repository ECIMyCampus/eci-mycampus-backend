import { z } from 'zod';
import {
  EventCreationRequestSchema,
  EventIdParamsSchema,
  EventRejectionRequestSchema,
  EventReportCreationRequestSchema,
  RadarFilterRequestSchema,
} from '../../models/dto/request/event.request.dto';
import {
  EventReportResponseSchema,
  EventResponseSchema,
  RadarEventResponseSchema,
  RegistrationResponseSchema,
} from '../../models/dto/response/event.response.dto';
import { ErrorResponseSchema } from '../../../../shared/errors/error.response.dto';

/**
 * Contrato documental de la API (equivalente a las interfaces `*Api` con OpenAPI).
 * Mantiene el controlador libre de metadatos: aquí viven validación de entrada,
 * contratos de salida y documentación Swagger (/docs).
 */
const TAG = ['Eventos'];
const bearer = [{ bearerAuth: [] }];

const errors = {
  400: ErrorResponseSchema.describe('Datos de entrada malformados'),
  401: ErrorResponseSchema.describe('No autenticado'),
  403: ErrorResponseSchema.describe('Rol sin permisos'),
  404: ErrorResponseSchema.describe('Evento inexistente'),
  409: ErrorResponseSchema.describe('Conflicto (duplicado o cupos agotados)'),
  422: ErrorResponseSchema.describe('Regla de negocio o transición de estado inválida'),
};

export const EventsApi = {
  getRadar: {
    tags: TAG,
    summary: 'Radar de eventos en vivo y próximos',
    description: 'Eventos PUBLICADOS no finalizados. Los eventos privados solo se muestran a su facultad.',
    querystring: RadarFilterRequestSchema,
    response: { 200: z.array(RadarEventResponseSchema), 400: errors[400] },
  },

  getEventById: {
    tags: TAG,
    summary: 'Detalle de un evento',
    params: EventIdParamsSchema,
    response: { 200: EventResponseSchema, 400: errors[400], 404: errors[404] },
  },

  createEvent: {
    tags: TAG,
    summary: 'Solicitar o publicar un evento',
    description: 'Organizadores autorizados publican directamente; el resto queda PENDIENTE_APROBACION.',
    security: bearer,
    body: EventCreationRequestSchema,
    response: { 201: EventResponseSchema, 400: errors[400], 401: errors[401], 403: errors[403], 422: errors[422] },
  },

  approveEvent: {
    tags: TAG,
    summary: 'Aprobar un evento pendiente (moderación)',
    security: bearer,
    params: EventIdParamsSchema,
    response: { 200: EventResponseSchema, 401: errors[401], 403: errors[403], 404: errors[404], 422: errors[422] },
  },

  rejectEvent: {
    tags: TAG,
    summary: 'Rechazar un evento pendiente (moderación)',
    security: bearer,
    params: EventIdParamsSchema,
    body: EventRejectionRequestSchema,
    response: {
      200: EventResponseSchema,
      400: errors[400],
      401: errors[401],
      403: errors[403],
      404: errors[404],
      422: errors[422],
    },
  },

  cancelEvent: {
    tags: TAG,
    summary: 'Cancelar un evento (organizador o moderador)',
    security: bearer,
    params: EventIdParamsSchema,
    response: { 200: EventResponseSchema, 401: errors[401], 403: errors[403], 404: errors[404], 422: errors[422] },
  },

  registerToEvent: {
    tags: TAG,
    summary: 'Inscripción atómica con control de cupos',
    security: bearer,
    params: EventIdParamsSchema,
    response: {
      201: RegistrationResponseSchema,
      401: errors[401],
      403: errors[403],
      404: errors[404],
      409: errors[409],
      422: errors[422],
    },
  },

  reportEvent: {
    tags: TAG,
    summary: 'Denunciar un evento',
    security: bearer,
    params: EventIdParamsSchema,
    body: EventReportCreationRequestSchema,
    response: {
      201: EventReportResponseSchema,
      400: errors[400],
      401: errors[401],
      403: errors[403],
      404: errors[404],
      409: errors[409],
      422: errors[422],
    },
  },
} as const;

