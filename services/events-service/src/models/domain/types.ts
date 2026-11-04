import type { Event } from './event';
import type { EventCategory, RegistrationStatus, ReportStatus, UserRole } from './enums';

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: Date;
  cancelledAt: Date | null;
}

export interface EventReport {
  id?: string;
  eventId: string;
  reporterUserId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt?: Date;
}

/** Proyección de lectura del Radar: evento + métricas agregadas. */
export interface EventWithStats {
  event: Event;
  registrationsCount: number;
  favoritesCount: number;
}

/** Usuario autenticado tal como lo entiende el dominio (independiente del JWT). */
export interface Actor {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  facultyId: string | null;
  isAuthorizedOrganizer: boolean;
}

/** Criterios del Radar ya normalizados (sin detalles HTTP). */
export interface RadarCriteria {
  category?: EventCategory;
  facultyId?: string;
  date?: Date;
  limit: number;
  viewerFacultyId?: string | null;
}
