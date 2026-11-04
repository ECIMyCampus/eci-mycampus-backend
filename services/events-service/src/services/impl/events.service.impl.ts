import { ConflictException, ResourceNotFoundException } from '../../exceptions/app.exception';
import type { IDomainEventPublisher } from '../../listeners/domain-event-publisher';
import type { Event } from '../../models/domain/event';
import type { Actor, EventReport, EventWithStats, RadarCriteria, Registration } from '../../models/domain/types';
import type {
  IEventReportRepository,
  IEventRepository,
  IRegistrationRepository,
} from '../../repositories/event.repository';
import type { IEventValidator } from '../../validators/event.validator';
import type { IEventsService } from '../events.service';

export type Clock = () => Date;

/**
 * Orquestador de casos de uso: carga -> valida (Validator) -> muta (Domain/State)
 * -> persiste (Repository) -> publica evento de dominio (Observer).
 */
export class EventsServiceImpl implements IEventsService {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly registrationRepository: IRegistrationRepository,
    private readonly reportRepository: IEventReportRepository,
    private readonly validator: IEventValidator,
    private readonly publisher: IDomainEventPublisher,
    private readonly clock: Clock = () => new Date(),
  ) {}

  getRadar(criteria: RadarCriteria): Promise<EventWithStats[]> {
    return this.eventRepository.findRadar(criteria, this.clock());
  }

  async getEventById(eventId: string, viewer: Actor | null): Promise<Event> {
    const event = await this.findEventOrThrow(eventId);
    const canSeeUnpublished =
      viewer !== null && (event.isOrganizedBy(viewer.id) || viewer.role === 'MODERADOR' || viewer.role === 'ADMIN');
    if (event.status !== 'PUBLICADO' && !canSeeUnpublished) {
      throw notFound(eventId);
    }
    return event;
  }

  async createEvent(draft: Event, organizer: Actor): Promise<Event> {
    this.validator.validateNewEvent(draft, this.clock());
    draft.submit(organizer.isAuthorizedOrganizer);
    return this.eventRepository.create(draft);
  }

  async approveEvent(eventId: string): Promise<Event> {
    const event = await this.findEventOrThrow(eventId);
    event.approve();
    const saved = await this.eventRepository.updateStatus(event);
    this.publisher.publish({
      type: 'EVENT_APPROVED',
      eventId,
      eventTitle: saved.title,
      organizerId: saved.organizerId,
      occurredAt: this.clock(),
    });
    return saved;
  }

  async rejectEvent(eventId: string, reason: string): Promise<Event> {
    const event = await this.findEventOrThrow(eventId);
    event.reject(reason);
    const saved = await this.eventRepository.updateStatus(event);
    this.publisher.publish({
      type: 'EVENT_REJECTED',
      eventId,
      eventTitle: saved.title,
      organizerId: saved.organizerId,
      reason,
      occurredAt: this.clock(),
    });
    return saved;
  }

  async cancelEvent(eventId: string, actor: Actor): Promise<Event> {
    const event = await this.findEventOrThrow(eventId);
    this.validator.validateCanCancel(event, actor);
    event.cancel();
    const saved = await this.eventRepository.updateStatus(event);
    this.publisher.publish({
      type: 'EVENT_CANCELLED',
      eventId,
      eventTitle: saved.title,
      organizerId: saved.organizerId,
      occurredAt: this.clock(),
    });
    return saved;
  }

  async registerAttendee(eventId: string, attendee: Actor): Promise<Registration> {
    const event = await this.findEventOrThrow(eventId);
    event.assertAcceptsRegistrations();
    await this.validator.validateCanRegister(event, attendee, this.clock());

    const registration = await this.registrationRepository.reserveSeat(
      eventId,
      attendee.id,
      event.hasLimitedCapacity(),
    );
    if (!registration) {
      throw new ConflictException('Lo sentimos, los cupos para este evento acaban de agotarse.');
    }

    this.publisher.publish({
      type: 'REGISTRATION_CONFIRMED',
      eventId,
      eventTitle: event.title,
      userId: attendee.id,
      userEmail: attendee.email,
      startTime: event.startTime,
      occurredAt: this.clock(),
    });
    return registration;
  }

  async reportEvent(report: EventReport, reporter: Actor): Promise<EventReport> {
    const event = await this.findEventOrThrow(report.eventId);
    event.assertAcceptsReports();
    await this.validator.validateCanReport(event, reporter);
    return this.reportRepository.create(report);
  }

  private async findEventOrThrow(eventId: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw notFound(eventId);
    return event;
  }
}

function notFound(eventId: string): ResourceNotFoundException {
  return new ResourceNotFoundException(`Evento con ID '${eventId}' no encontrado.`);
}

