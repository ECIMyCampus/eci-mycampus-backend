import { describe, expect, it } from 'vitest';
import { InvalidStateException } from '../../../src/shared/errors/app.exception';
import { buildEvent, NOW } from '../support/fixtures';

describe('Event · máquina de estados (State Deny-by-Default)', () => {
  it('RF-EVT-01 - un organizador autorizado publica directamente al enviar el borrador', () => {
    // Arrange
    const event = buildEvent({ status: 'BORRADOR' });
    // Act
    event.submit(true);
    // Assert
    expect(event.status).toBe('PUBLICADO');
  });

  it('RF-EVT-01 - un organizador no autorizado deja el evento PENDIENTE_APROBACION', () => {
    // Arrange
    const event = buildEvent({ status: 'BORRADOR' });
    // Act
    event.submit(false);
    // Assert
    expect(event.status).toBe('PENDIENTE_APROBACION');
  });

  it('RF-MOD-01 - un moderador aprueba un evento pendiente', () => {
    // Arrange
    const event = buildEvent({ status: 'PENDIENTE_APROBACION' });
    // Act
    event.approve();
    // Assert
    expect(event.status).toBe('PUBLICADO');
  });

  it('RF-MOD-02 - rechazar guarda el motivo y deja el evento RECHAZADO', () => {
    // Arrange
    const event = buildEvent({ status: 'PENDIENTE_APROBACION' });
    // Act
    event.reject('Contenido no acorde a la política institucional');
    // Assert
    expect(event.status).toBe('RECHAZADO');
    expect(event.rejectionReason).toBe('Contenido no acorde a la política institucional');
  });

  it.each(['RECHAZADO', 'CANCELADO', 'ARCHIVADO'] as const)(
    'los estados terminales (%s) bloquean cualquier transición con 422',
    (status) => {
      // Arrange
      const event = buildEvent({ status });
      // Act + Assert
      expect(() => event.approve()).toThrow(InvalidStateException);
      expect(() => event.cancel()).toThrow(InvalidStateException);
      expect(() => event.submit(true)).toThrow(InvalidStateException);
      expect(() => event.assertAcceptsRegistrations()).toThrow(InvalidStateException);
    },
  );

  it('no se puede aprobar un evento que ya está PUBLICADO', () => {
    // Arrange
    const event = buildEvent({ status: 'PUBLICADO' });
    // Act + Assert
    expect(() => event.approve()).toThrow('No se puede APROBAR el evento desde el estado PUBLICADO.');
  });

  it('solo un evento PUBLICADO admite inscripciones', () => {
    // Arrange
    const published = buildEvent({ status: 'PUBLICADO' });
    const pending = buildEvent({ status: 'PENDIENTE_APROBACION' });
    const relocating = buildEvent({ status: 'REUBICACION_LOGISTICA_PENDIENTE' });
    // Act + Assert
    expect(() => published.assertAcceptsRegistrations()).not.toThrow();
    expect(() => pending.assertAcceptsRegistrations()).toThrow(InvalidStateException);
    expect(() => relocating.assertAcceptsRegistrations()).toThrow(InvalidStateException);
    expect(() => relocating.assertAcceptsReports()).not.toThrow();
  });

  it('RN-007 - calcula el estado temporal respecto al reloj', () => {
    // Arrange
    const event = buildEvent({
      startTime: new Date('2026-11-10T14:00:00.000Z'),
      endTime: new Date('2026-11-10T16:00:00.000Z'),
    });
    // Act + Assert
    expect(event.getTemporalStatus(new Date('2026-11-10T13:00:00.000Z'))).toBe('PROXIMO');
    expect(event.getTemporalStatus(NOW)).toBe('EN_CURSO');
    expect(event.getTemporalStatus(new Date('2026-11-10T17:00:00.000Z'))).toBe('FINALIZADO');
  });
});

