import { Prisma } from '@prisma/client';
import type {
  Event as EventEntity,
  EventRegistration as RegistrationEntity,
  EventReport as ReportEntity,
} from '@prisma/client';
import { Event } from '../models/domain/event';
import type { EventReport, Registration } from '../models/domain/types';

/**
 * Mapper de persistencia (Domain <-> Prisma Entity).
 * Es el ÚNICO lugar donde se conocen a la vez el modelo de dominio y los tipos de Prisma.
 */
export class EventEntityMapper {
  toDomain(entity: EventEntity): Event {
    return new Event({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      category: entity.category,
      facultyId: entity.facultyId,
      organizerId: entity.organizerId,
      organizerName: entity.organizerName,
      buildingId: entity.buildingId,
      specificLocation: entity.specificLocation,
      startTime: entity.startTime,
      endTime: entity.endTime,
      originalEndTime: entity.originalEndTime,
      status: entity.status,
      accessType: entity.accessType,
      price: entity.price.toFixed(2),
      isPublic: entity.isPublic,
      requiresRegistration: entity.requiresRegistration,
      maxCapacity: entity.maxCapacity,
      availableCapacity: entity.availableCapacity,
      imageUrl: entity.imageUrl,
      rejectionReason: entity.rejectionReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  toCreateData(event: Event): Prisma.EventCreateInput {
    return {
      title: event.title,
      description: event.description,
      category: event.category,
      facultyId: event.facultyId,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      buildingId: event.buildingId,
      specificLocation: event.specificLocation,
      startTime: event.startTime,
      endTime: event.endTime,
      originalEndTime: event.originalEndTime,
      status: event.status,
      accessType: event.accessType,
      price: new Prisma.Decimal(event.price),
      isPublic: event.isPublic,
      requiresRegistration: event.requiresRegistration,
      maxCapacity: event.maxCapacity,
      availableCapacity: event.availableCapacity,
      imageUrl: event.imageUrl,
    };
  }

  /** Solo los campos que pueden cambiar tras una transición de estado. */
  toStatusUpdateData(event: Event): Prisma.EventUpdateInput {
    return {
      status: event.status,
      rejectionReason: event.rejectionReason,
    };
  }

  toRegistrationDomain(entity: RegistrationEntity): Registration {
    return {
      id: entity.id,
      eventId: entity.eventId,
      userId: entity.userId,
      status: entity.status,
      registeredAt: entity.registeredAt,
      cancelledAt: entity.cancelledAt,
    };
  }

  toReportDomain(entity: ReportEntity): EventReport {
    return {
      id: entity.id,
      eventId: entity.eventId,
      reporterUserId: entity.reporterUserId,
      reason: entity.reason,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}

