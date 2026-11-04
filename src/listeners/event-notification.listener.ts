import type { DomainEvent } from '../models/domain/events/domain-events';
import type { Notification } from '../services/notification/notification.strategy';
import type { NotificationStrategyFactory } from '../services/notification/notification-strategy.factory';

/**
 * Observer: traduce eventos de dominio en notificaciones y las despacha
 * con la estrategia del canal correspondiente.
 */
export class EventNotificationListener {
  constructor(private readonly strategyFactory: NotificationStrategyFactory) {}

  readonly handle = async (event: DomainEvent): Promise<void> => {
    const notification = this.toNotification(event);
    await this.strategyFactory.getStrategy(notification.channel).send(notification);
  };

  private toNotification(event: DomainEvent): Notification {
    switch (event.type) {
      case 'REGISTRATION_CONFIRMED':
        return {
          channel: event.userEmail ? 'EMAIL' : 'LOG',
          recipient: event.userEmail ?? event.userId,
          subject: `Inscripción confirmada: ${event.eventTitle}`,
          body: `Tu inscripción a "${event.eventTitle}" quedó confirmada. Inicia el ${event.startTime.toISOString()}.`,
        };
      case 'EVENT_APPROVED':
        return {
          channel: 'LOG',
          recipient: event.organizerId,
          subject: `Evento aprobado: ${event.eventTitle}`,
          body: `Tu evento "${event.eventTitle}" fue aprobado y ya es visible en el Radar.`,
        };
      case 'EVENT_REJECTED':
        return {
          channel: 'LOG',
          recipient: event.organizerId,
          subject: `Evento rechazado: ${event.eventTitle}`,
          body: `Tu evento "${event.eventTitle}" fue rechazado. Motivo: ${event.reason}`,
        };
      case 'EVENT_CANCELLED':
        return {
          channel: 'LOG',
          recipient: event.organizerId,
          subject: `Evento cancelado: ${event.eventTitle}`,
          body: `El evento "${event.eventTitle}" fue cancelado.`,
        };
    }
  }
}

