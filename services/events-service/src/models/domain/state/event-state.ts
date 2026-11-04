import type { Event } from '../event';
import type { EventStatus } from '../enums';
import { InvalidStateException } from '../../../exceptions/app.exception';

/**
 * Contrato del patrón State para el ciclo de vida de un evento.
 */
export interface EventState {
  readonly status: EventStatus;
  submit(event: Event, isAuthorizedOrganizer: boolean): void;
  approve(event: Event): void;
  reject(event: Event, reason: string): void;
  cancel(event: Event): void;
  assertAcceptsRegistrations(event: Event): void;
  assertAcceptsReports(event: Event): void;
}

/**
 * Clase base "Deny-by-Default": TODAS las acciones lanzan InvalidStateException (422).
 * Cada estado concreto sobrescribe únicamente las transiciones legalmente permitidas;
 * los estados terminales no sobrescriben nada y quedan bloqueados automáticamente.
 */
export abstract class AbstractEventState implements EventState {
  abstract readonly status: EventStatus;

  submit(_event: Event, _isAuthorizedOrganizer: boolean): void {
    throw this.denied('ENVIAR');
  }

  approve(_event: Event): void {
    throw this.denied('APROBAR');
  }

  reject(_event: Event, _reason: string): void {
    throw this.denied('RECHAZAR');
  }

  cancel(_event: Event): void {
    throw this.denied('CANCELAR');
  }

  assertAcceptsRegistrations(_event: Event): void {
    throw new InvalidStateException(
      `El evento no admite inscripciones en estado ${this.status}.`,
    );
  }

  assertAcceptsReports(_event: Event): void {
    throw new InvalidStateException(`El evento no admite denuncias en estado ${this.status}.`);
  }

  protected denied(action: string): InvalidStateException {
    return new InvalidStateException(`No se puede ${action} el evento desde el estado ${this.status}.`);
  }
}

