/**
 * Eventos internos de dominio (Observer). Son objetos inmutables que el servicio
 * publica tras completar un caso de uso; los listeners reaccionan sin acoplar al servicio.
 */
export type DomainEvent =
  | {
      readonly type: 'EVENT_APPROVED';
      readonly eventId: string;
      readonly eventTitle: string;
      readonly organizerId: string;
      readonly occurredAt: Date;
    }
  | {
      readonly type: 'EVENT_REJECTED';
      readonly eventId: string;
      readonly eventTitle: string;
      readonly organizerId: string;
      readonly reason: string;
      readonly occurredAt: Date;
    }
  | {
      readonly type: 'EVENT_CANCELLED';
      readonly eventId: string;
      readonly eventTitle: string;
      readonly organizerId: string;
      readonly occurredAt: Date;
    }
  | {
      readonly type: 'REGISTRATION_CONFIRMED';
      readonly eventId: string;
      readonly eventTitle: string;
      readonly userId: string;
      readonly userEmail: string | null;
      readonly startTime: Date;
      readonly occurredAt: Date;
    };

export type DomainEventType = DomainEvent['type'];

