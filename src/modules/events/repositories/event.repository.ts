import type { Event } from '../models/domain/event';
import type { EventReport, EventWithStats, RadarCriteria, Registration } from '../models/domain/types';

/**
 * Puertos de persistencia. Los servicios y validadores dependen de estas
 * abstracciones (DIP), nunca de Prisma directamente.
 */
export interface IEventRepository {
  findById(id: string): Promise<Event | null>;
  findRadar(criteria: RadarCriteria, now: Date): Promise<EventWithStats[]>;
  create(event: Event): Promise<Event>;
  updateStatus(event: Event): Promise<Event>;
}

export interface IRegistrationRepository {
  findByEventAndUser(eventId: string, userId: string): Promise<Registration | null>;
  /**
   * Reserva atómica de cupo. Devuelve `null` si no quedan cupos disponibles.
   * Debe ejecutarse en una única transacción para evitar sobrecupo concurrente.
   */
  reserveSeat(eventId: string, userId: string, hasLimitedCapacity: boolean): Promise<Registration | null>;
}

export interface IEventReportRepository {
  existsByEventAndReporter(eventId: string, reporterUserId: string): Promise<boolean>;
  create(report: EventReport): Promise<EventReport>;
}

