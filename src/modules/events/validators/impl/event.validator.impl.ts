import {
  BusinessRuleException,
  ConflictException,
  ForbiddenException,
} from '../../../../shared/errors/app.exception';
import type { Event } from '../../models/domain/event';
import type { UserRole } from '../../models/domain/enums';
import type { Actor } from '../../models/domain/types';
import type { IEventReportRepository, IRegistrationRepository } from '../../repositories/event.repository';
import type { IEventValidator } from '../event.validator';

const MODERATION_ROLES: ReadonlySet<UserRole> = new Set(['MODERADOR', 'ADMIN']);

export class EventValidatorImpl implements IEventValidator {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
    private readonly reportRepository: IEventReportRepository,
  ) {}

  validateNewEvent(event: Event, now: Date): void {
    if (event.endTime <= event.startTime) {
      throw new BusinessRuleException('La fecha de finalización debe ser posterior a la fecha de inicio.');
    }
    if (event.endTime <= now) {
      throw new BusinessRuleException('No se puede crear un evento que ya finalizó.');
    }
    if (event.accessType === 'EXCLUSIVO_FACULTAD' && !event.facultyId) {
      throw new BusinessRuleException('Un evento exclusivo de facultad debe indicar la facultad (facultyId).');
    }
    if (event.maxCapacity !== null && !event.requiresRegistration) {
      throw new BusinessRuleException('Solo los eventos con inscripción previa pueden definir un cupo máximo.');
    }
  }

  async validateCanRegister(event: Event, attendee: Actor, now: Date): Promise<void> {
    if (!event.requiresRegistration) {
      throw new BusinessRuleException('Este evento es de acceso libre y no requiere inscripción.');
    }
    if (event.hasEnded(now)) {
      throw new BusinessRuleException('No es posible inscribirse a un evento que ya finalizó.');
    }
    if (event.accessType === 'EXCLUSIVO_FACULTAD' && event.facultyId !== attendee.facultyId) {
      throw new BusinessRuleException('Este evento es exclusivo para miembros de la facultad organizadora.');
    }

    const existing = await this.registrationRepository.findByEventAndUser(event.id!, attendee.id);
    if (existing?.status === 'CONFIRMADA') {
      throw new ConflictException('Ya tienes una inscripción confirmada para este evento.');
    }
  }

  async validateCanReport(event: Event, reporter: Actor): Promise<void> {
    if (event.isOrganizedBy(reporter.id)) {
      throw new BusinessRuleException('No puedes denunciar un evento que tú mismo organizas.');
    }
    if (await this.reportRepository.existsByEventAndReporter(event.id!, reporter.id)) {
      throw new ConflictException('Ya registraste una denuncia para este evento.');
    }
  }

  validateCanCancel(event: Event, actor: Actor): void {
    if (!event.isOrganizedBy(actor.id) && !MODERATION_ROLES.has(actor.role)) {
      throw new ForbiddenException('Solo el organizador o un moderador pueden cancelar este evento.');
    }
  }
}

