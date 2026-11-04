import type { DomainEvent } from '../models/domain/events/domain-events';
import type { AppLogger } from '../utils/logger';

export type DomainEventHandler = (event: DomainEvent) => Promise<void> | void;

export interface IDomainEventPublisher {
  publish(event: DomainEvent): void;
}

/**
 * Observer en memoria. Los handlers se ejecutan DESPUÉS de responder (setImmediate)
 * y sus fallos se registran sin afectar la transacción principal del caso de uso.
 */
export class InMemoryDomainEventPublisher implements IDomainEventPublisher {
  private readonly handlers: DomainEventHandler[] = [];

  constructor(private readonly logger: AppLogger) {}

  subscribe(handler: DomainEventHandler): void {
    this.handlers.push(handler);
  }

  publish(event: DomainEvent): void {
    for (const handler of this.handlers) {
      setImmediate(() => {
        Promise.resolve()
          .then(() => handler(event))
          .catch((err: unknown) =>
            this.logger.error({ err, eventType: event.type }, 'Fallo procesando evento de dominio'),
          );
      });
    }
  }
}

