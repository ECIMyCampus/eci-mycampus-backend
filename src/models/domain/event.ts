import type { AccessType, EventCategory, EventStatus, TemporalStatus } from './enums';
import { EventStateFactory } from './state/event-state.factory';

export interface EventProps {
  id?: string;
  title: string;
  description: string;
  category: EventCategory;
  facultyId: string | null;
  organizerId: string;
  organizerName: string;
  buildingId: string;
  specificLocation: string;
  startTime: Date;
  endTime: Date;
  originalEndTime?: Date;
  status?: EventStatus;
  accessType: AccessType;
  /** Precio como decimal en string (ej. "12500.00") para no perder precisión con `number`. */
  price: string;
  isPublic: boolean;
  requiresRegistration: boolean;
  maxCapacity: number | null;
  availableCapacity?: number | null;
  imageUrl: string | null;
  rejectionReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad rica de dominio. No importa nada de Fastify, Prisma ni Zod.
 * Las transiciones de estado se delegan en el objeto State correspondiente.
 */
export class Event {
  readonly id?: string;
  readonly title: string;
  readonly description: string;
  readonly category: EventCategory;
  readonly facultyId: string | null;
  readonly organizerId: string;
  readonly organizerName: string;
  readonly buildingId: string;
  readonly specificLocation: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly originalEndTime: Date;
  readonly accessType: AccessType;
  readonly price: string;
  readonly isPublic: boolean;
  readonly requiresRegistration: boolean;
  readonly maxCapacity: number | null;
  readonly availableCapacity: number | null;
  readonly imageUrl: string | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  private _status: EventStatus;
  private _rejectionReason: string | null;

  constructor(props: EventProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.category = props.category;
    this.facultyId = props.facultyId;
    this.organizerId = props.organizerId;
    this.organizerName = props.organizerName;
    this.buildingId = props.buildingId;
    this.specificLocation = props.specificLocation;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.originalEndTime = props.originalEndTime ?? props.endTime;
    this.accessType = props.accessType;
    this.price = props.price;
    this.isPublic = props.isPublic;
    this.requiresRegistration = props.requiresRegistration;
    this.maxCapacity = props.maxCapacity;
    this.availableCapacity =
      props.availableCapacity !== undefined ? props.availableCapacity : props.maxCapacity;
    this.imageUrl = props.imageUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this._status = props.status ?? 'BORRADOR';
    this._rejectionReason = props.rejectionReason ?? null;
  }

  get status(): EventStatus {
    return this._status;
  }

  get rejectionReason(): string | null {
    return this._rejectionReason;
  }

  // ---- Transiciones (delegadas al patrón State) ----

  submit(isAuthorizedOrganizer: boolean): void {
    this.state().submit(this, isAuthorizedOrganizer);
  }

  approve(): void {
    this.state().approve(this);
  }

  reject(reason: string): void {
    this.state().reject(this, reason);
  }

  cancel(): void {
    this.state().cancel(this);
  }

  assertAcceptsRegistrations(): void {
    this.state().assertAcceptsRegistrations(this);
  }

  assertAcceptsReports(): void {
    this.state().assertAcceptsReports(this);
  }

  // ---- Comportamiento de negocio ----

  getTemporalStatus(now: Date): TemporalStatus {
    if (now < this.startTime) return 'PROXIMO';
    if (now <= this.endTime) return 'EN_CURSO';
    return 'FINALIZADO';
  }

  hasEnded(now: Date): boolean {
    return this.getTemporalStatus(now) === 'FINALIZADO';
  }

  isOrganizedBy(userId: string): boolean {
    return this.organizerId === userId;
  }

  hasLimitedCapacity(): boolean {
    return this.maxCapacity !== null;
  }

  // ---- Uso exclusivo de los objetos State ----

  /** @internal Solo debe invocarse desde una implementación de EventState. */
  transitionTo(status: EventStatus): void {
    this._status = status;
  }

  /** @internal Solo debe invocarse desde una implementación de EventState. */
  registerRejectionReason(reason: string): void {
    this._rejectionReason = reason;
  }

  private state() {
    return EventStateFactory.fromStatus(this._status);
  }
}

