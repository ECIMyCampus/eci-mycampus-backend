import type { Event } from '../event';
import { AbstractEventState } from './event-state';

/** BORRADOR: puede enviarse (publicación directa o a moderación) o cancelarse. */
export class BorradorState extends AbstractEventState {
  readonly status = 'BORRADOR' as const;

  override submit(event: Event, isAuthorizedOrganizer: boolean): void {
    event.transitionTo(isAuthorizedOrganizer ? 'PUBLICADO' : 'PENDIENTE_APROBACION');
  }

  override cancel(event: Event): void {
    event.transitionTo('CANCELADO');
  }
}

/** PENDIENTE_APROBACION: un moderador lo aprueba o rechaza; el organizador puede cancelarlo. */
export class PendienteAprobacionState extends AbstractEventState {
  readonly status = 'PENDIENTE_APROBACION' as const;

  override approve(event: Event): void {
    event.transitionTo('PUBLICADO');
  }

  override reject(event: Event, reason: string): void {
    event.registerRejectionReason(reason);
    event.transitionTo('RECHAZADO');
  }

  override cancel(event: Event): void {
    event.transitionTo('CANCELADO');
  }
}

/** PUBLICADO: visible en el Radar; admite inscripciones y denuncias; puede cancelarse. */
export class PublicadoState extends AbstractEventState {
  readonly status = 'PUBLICADO' as const;

  override cancel(event: Event): void {
    event.transitionTo('CANCELADO');
  }

  override assertAcceptsRegistrations(): void {
    // Permitido.
  }

  override assertAcceptsReports(): void {
    // Permitido.
  }
}

/** REUBICACION_LOGISTICA_PENDIENTE: sigue siendo visible (admite denuncias) pero no nuevas inscripciones. */
export class ReubicacionLogisticaPendienteState extends AbstractEventState {
  readonly status = 'REUBICACION_LOGISTICA_PENDIENTE' as const;

  override cancel(event: Event): void {
    event.transitionTo('CANCELADO');
  }

  override assertAcceptsReports(): void {
    // Permitido.
  }
}

/** Estados terminales: no sobrescriben nada => cualquier acción lanza 422. */
export class RechazadoState extends AbstractEventState {
  readonly status = 'RECHAZADO' as const;
}

export class CanceladoState extends AbstractEventState {
  readonly status = 'CANCELADO' as const;
}

export class ArchivadoState extends AbstractEventState {
  readonly status = 'ARCHIVADO' as const;
}

