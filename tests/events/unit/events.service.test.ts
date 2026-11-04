import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConflictException,
  InvalidStateException,
  ResourceNotFoundException,
} from '../../../src/shared/errors/app.exception';
import { EventsServiceImpl } from '../../../src/modules/events/services/impl/events.service.impl';
import { EventValidatorImpl } from '../../../src/modules/events/validators/impl/event.validator.impl';
import {
  buildActor,
  buildEvent,
  EVENT_ID,
  InMemoryEventRepository,
  InMemoryRegistrationRepository,
  InMemoryReportRepository,
  NOW,
  RecordingPublisher,
} from '../support/fixtures';

describe('EventsServiceImpl', () => {
  let events: InMemoryEventRepository;
  let registrations: InMemoryRegistrationRepository;
  let reports: InMemoryReportRepository;
  let publisher: RecordingPublisher;
  let service: EventsServiceImpl;

  beforeEach(() => {
    events = new InMemoryEventRepository();
    registrations = new InMemoryRegistrationRepository();
    reports = new InMemoryReportRepository();
    publisher = new RecordingPublisher();
    service = new EventsServiceImpl(
      events,
      registrations,
      reports,
      new EventValidatorImpl(registrations, reports),
      publisher,
      () => NOW,
    );
  });

  it('RF-EVT-01 - crea el evento como PENDIENTE_APROBACION si el organizador no está autorizado', async () => {
    // Arrange
    const draft = buildEvent({ id: undefined, status: 'BORRADOR' });
    // Act
    const created = await service.createEvent(draft, buildActor());
    // Assert
    expect(created.id).toBeDefined();
    expect(created.status).toBe('PENDIENTE_APROBACION');
  });

  it('RF-MOD-01 - aprueba un evento pendiente y publica EVENT_APPROVED', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent({ status: 'PENDIENTE_APROBACION' }));
    // Act
    const approved = await service.approveEvent(EVENT_ID);
    // Assert
    expect(approved.status).toBe('PUBLICADO');
    expect(publisher.published).toEqual([expect.objectContaining({ type: 'EVENT_APPROVED', eventId: EVENT_ID })]);
  });

  it('responde 404 cuando el evento no existe', async () => {
    // Act + Assert
    await expect(service.approveEvent('no-existe')).rejects.toThrow(ResourceNotFoundException);
  });

  it('oculta eventos no publicados a terceros (404) pero no a su organizador', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent({ status: 'PENDIENTE_APROBACION' }));
    // Act + Assert
    await expect(service.getEventById(EVENT_ID, null)).rejects.toThrow(ResourceNotFoundException);
    await expect(service.getEventById(EVENT_ID, buildActor({ id: 'organizer-1' }))).resolves.toBeDefined();
  });

  it('RF-INS-01 - inscribe al usuario y publica REGISTRATION_CONFIRMED', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    const attendee = buildActor();
    // Act
    const registration = await service.registerAttendee(EVENT_ID, attendee);
    // Assert
    expect(registration.status).toBe('CONFIRMADA');
    expect(publisher.published[0]).toMatchObject({ type: 'REGISTRATION_CONFIRMED', userEmail: attendee.email });
  });

  it('RN-005 - responde 409 cuando se agotan los cupos', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    registrations.seatsLeft = 0;
    // Act + Assert
    await expect(service.registerAttendee(EVENT_ID, buildActor())).rejects.toThrow(ConflictException);
    expect(publisher.published).toHaveLength(0);
  });

  it('responde 422 al inscribirse a un evento cancelado', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent({ status: 'CANCELADO' }));
    // Act + Assert
    await expect(service.registerAttendee(EVENT_ID, buildActor())).rejects.toThrow(InvalidStateException);
  });

  it('cancela un evento del organizador y publica EVENT_CANCELLED', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    // Act
    const cancelled = await service.cancelEvent(EVENT_ID, buildActor({ id: 'organizer-1' }));
    // Assert
    expect(cancelled.status).toBe('CANCELADO');
    expect(publisher.published[0]?.type).toBe('EVENT_CANCELLED');
  });

  it('registra una denuncia válida', async () => {
    // Arrange
    events.events.set(EVENT_ID, buildEvent());
    const reporter = buildActor();
    // Act
    const report = await service.reportEvent(
      { eventId: EVENT_ID, reporterUserId: reporter.id, reason: 'Información falsa', description: null, status: 'RECIBIDO' },
      reporter,
    );
    // Assert
    expect(report.id).toBe('report-1');
  });
});

