import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ConsoleEmailAdapter } from '../../src/adapters/impl/console-email.adapter';
import { loadConfig } from '../../src/config/env';
import { InMemoryDomainEventPublisher } from '../../src/listeners/domain-event-publisher';
import { EventEntityMapper } from '../../src/mappers/event-entity.mapper';
import {
  EmailNotificationStrategy,
  LogNotificationStrategy,
} from '../../src/services/notification/notification.strategies';
import type { AppLogger } from '../../src/utils/logger';
import { buildEvent, EVENT_ID, NOW } from '../support/fixtures';

const fakeLogger = (): AppLogger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

describe('EventEntityMapper (Domain <-> Prisma)', () => {
  const mapper = new EventEntityMapper();

  it('convierte el Decimal de Prisma a string con 2 decimales y conserva el estado', () => {
    // Arrange
    const entity = {
      id: EVENT_ID,
      title: 'Feria',
      description: 'Feria de emprendimiento',
      category: 'CULTURAL',
      facultyId: null,
      organizerId: 'o1',
      organizerName: 'Bienestar',
      buildingId: 'BLQ-C',
      specificLocation: 'Plazoleta',
      startTime: NOW,
      endTime: NOW,
      originalEndTime: NOW,
      status: 'RECHAZADO',
      accessType: 'LIBRE',
      price: new Prisma.Decimal('15000.5'),
      isPublic: true,
      requiresRegistration: false,
      maxCapacity: null,
      availableCapacity: null,
      imageUrl: null,
      rejectionReason: 'Duplicado',
      createdAt: NOW,
      updatedAt: NOW,
    } as const;
    // Act
    const event = mapper.toDomain(entity);
    // Assert
    expect(event.price).toBe('15000.50');
    expect(event.status).toBe('RECHAZADO');
    expect(event.rejectionReason).toBe('Duplicado');
  });

  it('genera datos de creación sin id y con precio Decimal', () => {
    // Act
    const data = mapper.toCreateData(buildEvent({ price: '12.30' }));
    // Assert
    expect(data).not.toHaveProperty('id');
    expect(data.price).toBeInstanceOf(Prisma.Decimal);
    expect(mapper.toStatusUpdateData(buildEvent())).toEqual({ status: 'PUBLICADO', rejectionReason: null });
  });
});

describe('loadConfig (fail-fast de variables de entorno)', () => {
  it('aplica valores por defecto en desarrollo', () => {
    // Act
    const config = loadConfig({ DATABASE_URL: 'postgresql://x' });
    // Assert
    expect(config.port).toBe(4003);
    expect(config.corsOrigin).toBe(true);
    expect(config.jwtSecret).toContain('dev_jwt_secret');
  });

  it('exige JWT_SECRET en producción', () => {
    // Act + Assert
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'production' })).toThrow('JWT_SECRET');
  });

  it('separa múltiples orígenes CORS', () => {
    // Act
    const config = loadConfig({ DATABASE_URL: 'postgresql://x', CORS_ORIGIN: 'http://a.com, http://b.com' });
    // Assert
    expect(config.corsOrigin).toEqual(['http://a.com', 'http://b.com']);
  });
});

describe('InMemoryDomainEventPublisher', () => {
  it('entrega el evento a los suscriptores y aísla sus fallos', async () => {
    // Arrange
    const logger = fakeLogger();
    const publisher = new InMemoryDomainEventPublisher(logger);
    const received: string[] = [];
    publisher.subscribe(() => {
      throw new Error('proveedor caído');
    });
    publisher.subscribe((e) => {
      received.push(e.type);
    });
    // Act
    publisher.publish({ type: 'EVENT_CANCELLED', eventId: 'e', eventTitle: 't', organizerId: 'o', occurredAt: NOW });
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Assert
    expect(received).toEqual(['EVENT_CANCELLED']);
    expect(logger.error).toHaveBeenCalledOnce();
  });
});

describe('Estrategias de notificación', () => {
  it('EMAIL delega en el adaptador escapando HTML', async () => {
    // Arrange
    const adapter = { send: vi.fn(async () => {}) };
    // Act
    await new EmailNotificationStrategy(adapter).send({
      channel: 'EMAIL',
      recipient: 'a@b.co',
      subject: 'Hola',
      body: '<script>x</script>',
    });
    // Assert
    expect(adapter.send).toHaveBeenCalledWith({ to: 'a@b.co', subject: 'Hola', html: '<p>&lt;script&gt;x&lt;/script&gt;</p>' });
  });

  it('LOG y ConsoleEmailAdapter solo registran en el logger', async () => {
    // Arrange
    const logger = fakeLogger();
    // Act
    await new LogNotificationStrategy(logger).send({ channel: 'LOG', recipient: 'u1', subject: 's', body: 'b' });
    await new ConsoleEmailAdapter(logger).send({ to: 'a@b.co', subject: 's', html: 'h' });
    // Assert
    expect(logger.info).toHaveBeenCalledTimes(2);
  });
});

