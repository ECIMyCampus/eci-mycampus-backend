import type { Event } from '../models/domain/event';
import type { Actor } from '../models/domain/types';

/**
 * Nivel 2 de validación: invariantes y reglas de negocio (solo lectura).
 * Lanza excepciones semánticas (403 / 409 / 422); nunca modifica datos.
 */
export interface IEventValidator {
  validateNewEvent(event: Event, now: Date): void;
  validateCanRegister(event: Event, attendee: Actor, now: Date): Promise<void>;
  validateCanReport(event: Event, reporter: Actor): Promise<void>;
  validateCanCancel(event: Event, actor: Actor): void;
}

