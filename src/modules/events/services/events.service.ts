import type { Event } from '../models/domain/event';
import type { Actor, EventReport, EventWithStats, RadarCriteria, Registration } from '../models/domain/types';

/**
 * Casos de uso del dominio de eventos. Recibe y devuelve objetos de dominio
 * (nunca DTOs ni entidades Prisma).
 */
export interface IEventsService {
  getRadar(criteria: RadarCriteria): Promise<EventWithStats[]>;
  getEventById(eventId: string, viewer: Actor | null): Promise<Event>;
  createEvent(draft: Event, organizer: Actor): Promise<Event>;
  approveEvent(eventId: string): Promise<Event>;
  rejectEvent(eventId: string, reason: string): Promise<Event>;
  cancelEvent(eventId: string, actor: Actor): Promise<Event>;
  registerAttendee(eventId: string, attendee: Actor): Promise<Registration>;
  reportEvent(report: EventReport, reporter: Actor): Promise<EventReport>;
}
