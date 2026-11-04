import type { PrismaClient } from '@prisma/client';
import { DEFAULT_ERROR_MESSAGES } from '../../shared/errors/error-handler';
import type { AppModule } from '../../shared/http/app-module';
import type { AppLogger } from '../../shared/utils/logger';
import type { IEmailAdapter } from './adapters/email.adapter';
import { ConsoleEmailAdapter } from './adapters/impl/console-email.adapter';
import { ResendEmailAdapter } from './adapters/impl/resend-email.adapter';
import { EventsController } from './controllers/events.controller';
import { InMemoryDomainEventPublisher } from './listeners/domain-event-publisher';
import { EventNotificationListener } from './listeners/event-notification.listener';
import { EventEntityMapper } from './mappers/event-entity.mapper';
import { EventMapper } from './mappers/event.mapper';
import { PrismaEventReportRepository } from './repositories/prisma/prisma-event-report.repository';
import { PrismaEventRepository } from './repositories/prisma/prisma-event.repository';
import { PrismaRegistrationRepository } from './repositories/prisma/prisma-registration.repository';
import { eventsRoutes } from './routes/events.routes';
import type { IEventsService } from './services/events.service';
import { EventsServiceImpl } from './services/impl/events.service.impl';
import { EmailNotificationStrategy, LogNotificationStrategy } from './services/notification/notification.strategies';
import { NotificationStrategyFactory } from './services/notification/notification-strategy.factory';
import { EventValidatorImpl } from './validators/impl/event.validator.impl';

/** Publica la API HTTP del módulo a partir de su servicio (las pruebas inyectan dobles). */
export function eventsHttpModule(eventsService: IEventsService): AppModule {
  return {
    prefix: '/api/v1/events',
    routes: eventsRoutes(new EventsController(eventsService, new EventMapper())),
    errorMessages: DEFAULT_ERROR_MESSAGES,
  };
}

export interface EventsModuleDependencies {
  prisma: PrismaClient;
  logger: AppLogger;
  resendApiKey?: string;
  emailFrom: string;
}

/** Conecta el módulo con sus implementaciones reales. */
export function createEventsModule({ prisma, logger, resendApiKey, emailFrom }: EventsModuleDependencies): AppModule {
  const entityMapper = new EventEntityMapper();

  const eventRepository = new PrismaEventRepository(prisma, entityMapper);
  const registrationRepository = new PrismaRegistrationRepository(prisma, entityMapper);
  const reportRepository = new PrismaEventReportRepository(prisma, entityMapper);

  const emailAdapter: IEmailAdapter = resendApiKey
    ? new ResendEmailAdapter(resendApiKey, emailFrom)
    : new ConsoleEmailAdapter(logger);

  const notificationFactory = new NotificationStrategyFactory([
    new EmailNotificationStrategy(emailAdapter),
    new LogNotificationStrategy(logger),
  ]);

  const publisher = new InMemoryDomainEventPublisher(logger);
  publisher.subscribe(new EventNotificationListener(notificationFactory).handle);

  return eventsHttpModule(
    new EventsServiceImpl(
      eventRepository,
      registrationRepository,
      reportRepository,
      new EventValidatorImpl(registrationRepository, reportRepository),
      publisher,
    ),
  );
}
