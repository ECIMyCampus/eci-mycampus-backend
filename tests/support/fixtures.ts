import { Event, type EventProps } from '../../src/models/domain/event';
import type { Actor, EventReport, EventWithStats, RadarCriteria, Registration } from '../../src/models/domain/types';
import type {
  IEventReportRepository,
  IEventRepository,
  IRegistrationRepository,
} from '../../src/repositories/event.repository';
import type { IDomainEventPublisher } from '../../src/listeners/domain-event-publisher';
import type { DomainEvent } from '../../src/models/domain/events/domain-events';

export const NOW = new Date('2026-11-10T15:00:00.000Z');
export const EVENT_ID = '11111111-1111-4111-8111-111111111111';

export function buildEvent(overrides: Partial<EventProps> = {}): Event {
  return new Event({
    id: EVENT_ID,
    title: 'Hackathon ECI 2026',
    description: 'Maratón de programación de 24 horas',
    category: 'ACADEMICO',
    facultyId: null,
    organizerId: 'organizer-1',
    organizerName: 'Semillero de IA',
    buildingId: 'BLQ-A',
    specificLocation: 'Auditorio A-101',
    startTime: new Date('2026-11-12T14:00:00.000Z'),
    endTime: new Date('2026-11-12T18:00:00.000Z'),
    status: 'PUBLICADO',
    accessType: 'LIBRE',
    price: '0.00',
    isPublic: true,
    requiresRegistration: true,
    maxCapacity: 50,
    imageUrl: null,
    ...overrides,
  });
}

export function buildActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: 'student-1',
    email: 'ana.perez@mail.escuelaing.edu.co',
    fullName: 'Ana Pérez',
    role: 'ESTUDIANTE',
    facultyId: null,
    isAuthorizedOrganizer: false,
    ...overrides,
  };
}

export class InMemoryEventRepository implements IEventRepository {
  readonly events = new Map<string, Event>();
  private sequence = 0;

  async findById(id: string) {
    return this.events.get(id) ?? null;
  }
  async findRadar(_criteria: RadarCriteria, _now: Date): Promise<EventWithStats[]> {
    return [...this.events.values()].map((event) => ({ event, registrationsCount: 0, favoritesCount: 0 }));
  }
  async create(event: Event) {
    const saved = new Event({ ...event, id: `generated-${++this.sequence}`, status: event.status });
    this.events.set(saved.id!, saved);
    return saved;
  }
  async updateStatus(event: Event) {
    this.events.set(event.id!, event);
    return event;
  }
}

export class InMemoryRegistrationRepository implements IRegistrationRepository {
  readonly registrations: Registration[] = [];
  seatsLeft = Number.POSITIVE_INFINITY;

  async findByEventAndUser(eventId: string, userId: string) {
    return this.registrations.find((r) => r.eventId === eventId && r.userId === userId) ?? null;
  }
  async reserveSeat(eventId: string, userId: string, hasLimitedCapacity: boolean) {
    if (hasLimitedCapacity) {
      if (this.seatsLeft <= 0) return null;
      this.seatsLeft -= 1;
    }
    const registration: Registration = {
      id: `reg-${this.registrations.length + 1}`,
      eventId,
      userId,
      status: 'CONFIRMADA',
      registeredAt: NOW,
      cancelledAt: null,
    };
    this.registrations.push(registration);
    return registration;
  }
}

export class InMemoryReportRepository implements IEventReportRepository {
  readonly reports: EventReport[] = [];

  async existsByEventAndReporter(eventId: string, reporterUserId: string) {
    return this.reports.some((r) => r.eventId === eventId && r.reporterUserId === reporterUserId);
  }
  async create(report: EventReport) {
    const saved = { ...report, id: `report-${this.reports.length + 1}`, createdAt: NOW };
    this.reports.push(saved);
    return saved;
  }
}

export class RecordingPublisher implements IDomainEventPublisher {
  readonly published: DomainEvent[] = [];
  publish(event: DomainEvent) {
    this.published.push(event);
  }
}
