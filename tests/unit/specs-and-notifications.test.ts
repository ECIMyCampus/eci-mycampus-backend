import { describe, expect, it, vi } from 'vitest';
import { EventNotificationListener } from '../../src/listeners/event-notification.listener';
import { EventSpecs } from '../../src/repositories/spec/event.specs';
import type { INotificationStrategy } from '../../src/services/notification/notification.strategy';
import { NotificationStrategyFactory } from '../../src/services/notification/notification-strategy.factory';
import { NOW } from '../support/fixtures';

describe('EventSpecs (Specification sobre Prisma)', () => {
  it('compone solo los predicados presentes', () => {
    // Act
    const where = EventSpecs.radar({ limit: 20 }, NOW);
    // Assert
    expect(where.AND).toEqual([
      { status: 'PUBLICADO' },
      { endTime: { gte: NOW } },
      { isPublic: true },
    ]);
  });

  it('agrega categoría, facultad y visibilidad privada para la facultad del usuario', () => {
    // Act
    const where = EventSpecs.radar(
      { limit: 10, category: 'DEPORTIVO', facultyId: 'fac-1', viewerFacultyId: 'fac-1' },
      NOW,
    );
    // Assert
    expect(where.AND).toContainEqual({ category: 'DEPORTIVO' });
    expect(where.AND).toContainEqual({ facultyId: 'fac-1' });
    expect(where.AND).toContainEqual({ OR: [{ isPublic: true }, { facultyId: 'fac-1' }] });
  });
});

describe('Notificaciones (Observer + Factory + Strategy)', () => {
  const strategy = (channel: 'EMAIL' | 'LOG'): INotificationStrategy => ({ channel, send: vi.fn(async () => {}) });

  it('envía correo cuando la inscripción tiene email', async () => {
    // Arrange
    const email = strategy('EMAIL');
    const log = strategy('LOG');
    const listener = new EventNotificationListener(new NotificationStrategyFactory([email, log]));
    // Act
    await listener.handle({
      type: 'REGISTRATION_CONFIRMED',
      eventId: 'e1',
      eventTitle: 'Hackathon',
      userId: 'u1',
      userEmail: 'u1@mail.escuelaing.edu.co',
      startTime: NOW,
      occurredAt: NOW,
    });
    // Assert
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ recipient: 'u1@mail.escuelaing.edu.co' }));
    expect(log.send).not.toHaveBeenCalled();
  });

  it('la fábrica falla explícitamente si el canal no está registrado', () => {
    // Arrange
    const factory = new NotificationStrategyFactory([strategy('LOG')]);
    // Act + Assert
    expect(() => factory.getStrategy('EMAIL')).toThrow('EMAIL');
  });
});
