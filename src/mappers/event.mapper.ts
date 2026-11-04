import { Event } from '../models/domain/event';
import type { Actor, EventReport, EventWithStats, RadarCriteria, Registration } from '../models/domain/types';
import type {
  EventCreationRequestDTO,
  EventReportCreationRequestDTO,
  RadarFilterRequestDTO,
} from '../models/dto/request/event.request.dto';
import type {
  EventReportResponseDTO,
  EventResponseDTO,
  RadarEventResponseDTO,
  RegistrationResponseDTO,
} from '../models/dto/response/event.response.dto';

/**
 * Mapper de frontera HTTP (DTO <-> Domain).
 * Usa listas blancas explícitas: campos sensibles (id, status, organizerId,
 * availableCapacity, rejectionReason...) NUNCA se toman del cuerpo de la petición.
 */
export class EventMapper {
  toDomain(dto: EventCreationRequestDTO, organizer: Actor): Event {
    return new Event({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      facultyId: dto.facultyId ?? null,
      organizerId: organizer.id,
      organizerName: organizer.fullName ?? organizer.email ?? organizer.id,
      buildingId: dto.buildingId,
      specificLocation: dto.specificLocation,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      accessType: dto.accessType,
      price: dto.price.toFixed(2),
      isPublic: dto.isPublic,
      requiresRegistration: dto.requiresRegistration,
      maxCapacity: dto.maxCapacity ?? null,
      imageUrl: dto.imageUrl ?? null,
    });
  }

  toRadarCriteria(dto: RadarFilterRequestDTO, viewer: Actor | null): RadarCriteria {
    return {
      category: dto.category,
      facultyId: dto.facultyId,
      date: dto.date ? new Date(`${dto.date}T00:00:00`) : undefined,
      limit: dto.limit,
      viewerFacultyId: viewer?.facultyId ?? null,
    };
  }

  toReportDomain(eventId: string, reporterUserId: string, dto: EventReportCreationRequestDTO): EventReport {
    return {
      eventId,
      reporterUserId,
      reason: dto.reason,
      description: dto.description ?? null,
      status: 'RECIBIDO',
    };
  }

  toResponse(event: Event, now: Date = new Date()): EventResponseDTO {
    const temporalStatus = event.getTemporalStatus(now);
    return {
      id: requireId(event.id),
      title: event.title,
      description: event.description,
      category: event.category,
      facultyId: event.facultyId,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      buildingId: event.buildingId,
      specificLocation: event.specificLocation,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      originalEndTime: event.originalEndTime.toISOString(),
      status: event.status,
      accessType: event.accessType,
      price: event.price,
      isPublic: event.isPublic,
      requiresRegistration: event.requiresRegistration,
      maxCapacity: event.maxCapacity,
      availableCapacity: event.availableCapacity,
      imageUrl: event.imageUrl,
      rejectionReason: event.rejectionReason,
      temporalStatus,
      isLive: temporalStatus === 'EN_CURSO',
    };
  }

  toRadarResponse(entry: EventWithStats, now: Date = new Date()): RadarEventResponseDTO {
    return {
      ...this.toResponse(entry.event, now),
      registrationsCount: entry.registrationsCount,
      favoritesCount: entry.favoritesCount,
    };
  }

  toRegistrationResponse(registration: Registration): RegistrationResponseDTO {
    return {
      id: registration.id,
      eventId: registration.eventId,
      userId: registration.userId,
      status: registration.status,
      registeredAt: registration.registeredAt.toISOString(),
    };
  }

  toReportResponse(report: EventReport): EventReportResponseDTO {
    return {
      id: requireId(report.id),
      eventId: report.eventId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: (report.createdAt ?? new Date()).toISOString(),
    };
  }
}

function requireId(id: string | undefined): string {
  if (!id) {
    throw new Error('No se puede mapear a respuesta un recurso que aún no ha sido persistido.');
  }
  return id;
}

