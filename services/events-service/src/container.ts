import type { IEmailAdapter } from './adapters/email.adapter';
import { ConsoleEmailAdapter } from './adapters/impl/console-email.adapter';
import { ResendEmailAdapter } from './adapters/impl/resend-email.adapter';
import type { AppConfig } from './config/env';
import { createPrismaClient } from './lib/prisma';
import { InMemoryDomainEventPublisher } from './listeners/domain-event-publisher';
import { EventNotificationListener } from './listeners/event-notification.listener';
import { EventEntityMapper } from './mappers/event-entity.mapper';
import { PrismaEventReportRepository } from './repositories/prisma/prisma-event-report.repository';
import { PrismaEventRepository } from './repositories/prisma/prisma-event.repository';
import { PrismaRegistrationRepository } from './repositories/prisma/prisma-registration.repository';
import type { IEventsService } from './services/events.service';
import { EventsServiceImpl } from './services/impl/events.service.impl';
import { EmailNotificationStrategy, LogNotificationStrategy } from './services/notification/notification.strategies';
import { NotificationStrategyFactory } from './services/notification/notification-strategy.factory';
import type { AppLogger } from './utils/logger';
import { EventValidatorImpl } from './validators/impl/event.validator.impl';

export interface AppContainer {
  eventsService: IEventsService;
  dispose(): Promise<void>;
}

/**
 * Composition Root: ÚNICO lugar donde se instancian implementaciones concretas.
 * Todas las clases reciben sus dependencias por constructor (DIP).
 */
export function buildContainer(config: AppConfig, logger: AppLogger): AppContainer {
  const prisma = createPrismaClient(config);
  const entityMapper = new EventEntityMapper();

  const eventRepository = new PrismaEventRepository(prisma, entityMapper);
  const registrationRepository = new PrismaRegistrationRepository(prisma, entityMapper);
  const reportRepository = new PrismaEventReportRepository(prisma, entityMapper);

  const emailAdapter: IEmailAdapter = config.resendApiKey
    ? new ResendEmailAdapter(config.resendApiKey, config.emailFrom)
    : new ConsoleEmailAdapter(logger);

  const notificationFactory = new NotificationStrategyFactory([
    new EmailNotificationStrategy(emailAdapter),
    new LogNotificationStrategy(logger),
  ]);

  const publisher = new InMemoryDomainEventPublisher(logger);
  publisher.subscribe(new EventNotificationListener(notificationFactory).handle);

  const eventsService = new EventsServiceImpl(
    eventRepository,
    registrationRepository,
    reportRepository,
    new EventValidatorImpl(registrationRepository, reportRepository),
    publisher,
  );

  return {
    eventsService,
    dispose: () => prisma.$disconnect(),
  };
}

