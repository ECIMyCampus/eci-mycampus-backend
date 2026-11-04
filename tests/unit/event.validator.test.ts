import { beforeEach, describe, expect, it } from 'vitest';
import {
  BusinessRuleException,
  ConflictException,
  ForbiddenException,
} from '../../src/exceptions/app.exception';
import { EventValidatorImpl } from '../../src/validators/impl/event.validator.impl';
import {
  buildActor,
  buildEvent,
  EVENT_ID,
  InMemoryRegistrationRepository,
  InMemoryReportRepository,
  NOW,
} from '../support/fixtures';

describe('EventValidatorImpl', () => {
  let registrations: InMemoryRegistrationRepository;
  let reports: InMemoryReportRepository;
  let validator: EventValidatorImpl;

  beforeEach(() => {
    registrations = new InMemoryRegistrationRepository();
    reports = new InMemoryReportRepository();
    validator = new EventValidatorImpl(registrations, reports);
  });

  describe('validateNewEvent', () => {
    it('RF-EVT-01 - rechaza un evento cuya fecha de fin no es posterior al inicio', () => {
      // Arrange
      const event = buildEvent({ endTime: new Date('2026-11-12T14:00:00.000Z') });
      // Act + Assert
      expect(() => validator.validateNewEvent(event, NOW)).toThrow(BusinessRuleException);
    });

    it('rechaza un evento que ya finalizó', () => {
      // Arrange
      const event = buildEvent({
        startTime: new Date('2026-11-01T10:00:00.000Z'),
        endTime: new Date('2026-11-01T12:00:00.000Z'),
      });
      // Act + Assert
      expect(() => validator.validateNewEvent(event, NOW)).toThrow('No se puede crear un evento que ya finalizó.');
    });

    it('exige facultyId para eventos exclusivos de facultad', () => {
      // Arrange
      const event = buildEvent({ accessType: 'EXCLUSIVO_FACULTAD', facultyId: null });
      // Act + Assert
      expect(() => validator.validateNewEvent(event, NOW)).toThrow(BusinessRuleException);
    });

    it('no permite cupo máximo en eventos de acceso libre sin inscripción', () => {
      // Arrange
      const event = buildEvent({ requiresRegistration: false, maxCapacity: 30 });
      // Act + Assert
      expect(() => validator.validateNewEvent(event, NOW)).toThrow(BusinessRuleException);
    });

    it('acepta un evento válido', () => {
      // Arrange
      const event = buildEvent();
      // Act + Assert
      expect(() => validator.validateNewEvent(event, NOW)).not.toThrow();
    });
  });

  describe('validateCanRegister', () => {
    it('RF-INS-01 - rechaza inscripción a eventos que no la requieren', async () => {
      // Arrange
      const event = buildEvent({ requiresRegistration: false, maxCapacity: null });
      // Act + Assert
      await expect(validator.validateCanRegister(event, buildActor(), NOW)).rejects.toThrow(BusinessRuleException);
    });

    it('rechaza inscripción de otra facultad a un evento exclusivo', async () => {
      // Arrange
      const event = buildEvent({ accessType: 'EXCLUSIVO_FACULTAD', facultyId: 'fac-sistemas' });
      const attendee = buildActor({ facultyId: 'fac-civil' });
      // Act + Assert
      await expect(validator.validateCanRegister(event, attendee, NOW)).rejects.toThrow(BusinessRuleException);
    });

    it('RN-005 - responde 409 si el usuario ya tiene inscripción confirmada', async () => {
      // Arrange
      const attendee = buildActor();
      await registrations.reserveSeat(EVENT_ID, attendee.id, false);
      // Act + Assert
      await expect(validator.validateCanRegister(buildEvent(), attendee, NOW)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateCanReport', () => {
    it('impide que el organizador denuncie su propio evento', async () => {
      // Arrange
      const organizer = buildActor({ id: 'organizer-1' });
      // Act + Assert
      await expect(validator.validateCanReport(buildEvent(), organizer)).rejects.toThrow(BusinessRuleException);
    });

    it('responde 409 ante una denuncia duplicada', async () => {
      // Arrange
      const reporter = buildActor();
      await reports.create({
        eventId: EVENT_ID,
        reporterUserId: reporter.id,
        reason: 'Spam',
        description: null,
        status: 'RECIBIDO',
      });
      // Act + Assert
      await expect(validator.validateCanReport(buildEvent(), reporter)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateCanCancel', () => {
    it('permite cancelar al organizador y a un moderador', () => {
      // Arrange
      const event = buildEvent();
      // Act + Assert
      expect(() => validator.validateCanCancel(event, buildActor({ id: 'organizer-1' }))).not.toThrow();
      expect(() => validator.validateCanCancel(event, buildActor({ role: 'MODERADOR' }))).not.toThrow();
    });

    it('responde 403 a un tercero', () => {
      // Act + Assert
      expect(() => validator.validateCanCancel(buildEvent(), buildActor())).toThrow(ForbiddenException);
    });
  });
});
