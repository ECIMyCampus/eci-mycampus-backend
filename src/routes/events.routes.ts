import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { EventsController } from '../controllers/events.controller';
import { EventsApi } from '../controllers/docs/events.api';
import type {
  EventCreationRequestDTO,
  EventIdParamsDTO,
  EventRejectionRequestDTO,
  EventReportCreationRequestDTO,
  RadarFilterRequestDTO,
} from '../models/dto/request/event.request.dto';
import { requireAuth, requireRoles } from '../security/auth.guard';

const ORGANIZER_ROLES = ['ESTUDIANTE', 'DOCENTE', 'ENTRENADOR', 'MODERADOR', 'ADMIN'] as const;
const MODERATION_ROLES = ['MODERADOR', 'ADMIN'] as const;

type ById = { Params: EventIdParamsDTO };

/**
 * Enrutamiento: une cada endpoint con su contrato (EventsApi), su guard RBAC y su handler.
 * Los genéricos explícitos alinean el tipado del controlador con el inferido por Zod.
 */
export function eventsRoutes(controller: EventsController) {
  return async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.get<{ Querystring: RadarFilterRequestDTO }>('/radar', { schema: EventsApi.getRadar }, controller.getRadar);
    app.get<ById>('/:id', { schema: EventsApi.getEventById }, controller.getEventById);

    app.post<{ Body: EventCreationRequestDTO }>(
      '/',
      { schema: EventsApi.createEvent, preHandler: requireRoles(...ORGANIZER_ROLES) },
      controller.createEvent,
    );
    app.patch<ById>(
      '/:id/approve',
      { schema: EventsApi.approveEvent, preHandler: requireRoles(...MODERATION_ROLES) },
      controller.approveEvent,
    );
    app.patch<ById & { Body: EventRejectionRequestDTO }>(
      '/:id/reject',
      { schema: EventsApi.rejectEvent, preHandler: requireRoles(...MODERATION_ROLES) },
      controller.rejectEvent,
    );
    app.patch<ById>('/:id/cancel', { schema: EventsApi.cancelEvent, preHandler: requireAuth }, controller.cancelEvent);
    app.post<ById>(
      '/:id/register',
      { schema: EventsApi.registerToEvent, preHandler: requireAuth },
      controller.registerToEvent,
    );
    app.post<ById & { Body: EventReportCreationRequestDTO }>(
      '/:id/reports',
      { schema: EventsApi.reportEvent, preHandler: requireAuth },
      controller.reportEvent,
    );
  };
}
