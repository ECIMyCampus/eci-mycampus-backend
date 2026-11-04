import type { EventStatus } from '../enums';
import type { EventState } from './event-state';
import {
  ArchivadoState,
  BorradorState,
  CanceladoState,
  PendienteAprobacionState,
  PublicadoState,
  RechazadoState,
  ReubicacionLogisticaPendienteState,
} from './event-states';

/**
 * Simple Factory: resuelve el objeto State a partir del enum persistido.
 * Los estados no tienen atributos, por lo que se reutilizan como singletons.
 * `Record<EventStatus, ...>` obliga al compilador a cubrir todos los estados.
 */
const STATES: Record<EventStatus, EventState> = {
  BORRADOR: new BorradorState(),
  PENDIENTE_APROBACION: new PendienteAprobacionState(),
  PUBLICADO: new PublicadoState(),
  RECHAZADO: new RechazadoState(),
  CANCELADO: new CanceladoState(),
  ARCHIVADO: new ArchivadoState(),
  REUBICACION_LOGISTICA_PENDIENTE: new ReubicacionLogisticaPendienteState(),
};

export const EventStateFactory = {
  fromStatus(status: EventStatus): EventState {
    return STATES[status];
  },
};

