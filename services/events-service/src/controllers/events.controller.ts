import type { FastifyReply, FastifyRequest } from 'fastify';
import type { EventMapper } from '../mappers/event.mapper';
import type {
  EventCreationRequestDTO,
  EventIdParamsDTO,
  EventRejectionRequestDTO,
  EventReportCreationRequestDTO,
  RadarFilterRequestDTO,
} from '../models/dto/request/event.request.dto';
import { currentActor } from '../security/auth.guard';
import type { IEventsService } from '../services/events.service';

type WithParams = { Params: EventIdParamsDTO };

/**
 * Controlador delgado: la validación sintáctica (Zod), la autorización (guards)
 * y el manejo de errores (GlobalErrorHandler) ocurren fuera de aquí.
 * Cada método: DTO -> Domain (mapper) -> servicio -> Domain -> ResponseDTO.
 */
export class EventsController {
  constructor(
    private readonly eventsService: IEventsService,
    private readonly mapper: EventMapper,
  ) {}

  getRadar = async (request: FastifyRequest<{ Querystring: RadarFilterRequestDTO }>, reply: FastifyReply) => {
    const criteria = this.mapper.toRadarCriteria(request.query, request.actor);
    const entries = await this.eventsService.getRadar(criteria);
    const now = new Date();
    return reply.status(200).send(entries.map((entry) => this.mapper.toRadarResponse(entry, now)));
  };

  getEventById = async (request: FastifyRequest<WithParams>, reply: FastifyReply) => {
    const event = await this.eventsService.getEventById(request.params.id, request.actor);
    return reply.status(200).send(this.mapper.toResponse(event));
  };

  createEvent = async (request: FastifyRequest<{ Body: EventCreationRequestDTO }>, reply: FastifyReply) => {
    const organizer = currentActor(request);
    const created = await this.eventsService.createEvent(this.mapper.toDomain(request.body, organizer), organizer);
    return reply.status(201).send(this.mapper.toResponse(created));
  };

  approveEvent = async (request: FastifyRequest<WithParams>, reply: FastifyReply) => {
    const event = await this.eventsService.approveEvent(request.params.id);
    return reply.status(200).send(this.mapper.toResponse(event));
  };

  rejectEvent = async (
    request: FastifyRequest<WithParams & { Body: EventRejectionRequestDTO }>,
    reply: FastifyReply,
  ) => {
    const event = await this.eventsService.rejectEvent(request.params.id, request.body.reason);
    return reply.status(200).send(this.mapper.toResponse(event));
  };

  cancelEvent = async (request: FastifyRequest<WithParams>, reply: FastifyReply) => {
    const event = await this.eventsService.cancelEvent(request.params.id, currentActor(request));
    return reply.status(200).send(this.mapper.toResponse(event));
  };

  registerToEvent = async (request: FastifyRequest<WithParams>, reply: FastifyReply) => {
    const registration = await this.eventsService.registerAttendee(request.params.id, currentActor(request));
    return reply.status(201).send(this.mapper.toRegistrationResponse(registration));
  };

  reportEvent = async (
    request: FastifyRequest<WithParams & { Body: EventReportCreationRequestDTO }>,
    reply: FastifyReply,
  ) => {
    const reporter = currentActor(request);
    const report = this.mapper.toReportDomain(request.params.id, reporter.id, request.body);
    const created = await this.eventsService.reportEvent(report, reporter);
    return reply.status(201).send(this.mapper.toReportResponse(created));
  };
}
