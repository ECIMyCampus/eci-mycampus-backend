import type { PrismaClient } from '@prisma/client';
import { EventEntityMapper } from '../../mappers/event-entity.mapper';
import type { Registration } from '../../models/domain/types';
import type { IRegistrationRepository } from '../event.repository';

export class PrismaRegistrationRepository implements IRegistrationRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly entityMapper: EventEntityMapper,
  ) {}

  async findByEventAndUser(eventId: string, userId: string): Promise<Registration | null> {
    const entity = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return entity ? this.entityMapper.toRegistrationDomain(entity) : null;
  }

  /**
   * Reserva atómica (RF-INS-01, RN-005):
   *  1. `UPDATE ... SET available_capacity = available_capacity - 1 WHERE available_capacity > 0`
   *     es una sola sentencia => Postgres la serializa por fila y nunca queda negativo.
   *  2. Reactiva una inscripción CANCELADA o crea una nueva. Si ya existe una CONFIRMADA,
   *     la restricción única (event_id, user_id) lanza P2002, la transacción hace rollback
   *     (se devuelve el cupo) y el GlobalErrorHandler responde 409.
   */
  async reserveSeat(eventId: string, userId: string, hasLimitedCapacity: boolean): Promise<Registration | null> {
    return this.prisma.$transaction(async (tx) => {
      if (hasLimitedCapacity) {
        const { count } = await tx.event.updateMany({
          where: { id: eventId, status: 'PUBLICADO', availableCapacity: { gt: 0 } },
          data: { availableCapacity: { decrement: 1 } },
        });
        if (count === 0) return null;
      }

      const reactivated = await tx.eventRegistration.updateMany({
        where: { eventId, userId, status: 'CANCELADA' },
        data: { status: 'CONFIRMADA', cancelledAt: null, registeredAt: new Date() },
      });

      const entity =
        reactivated.count > 0
          ? await tx.eventRegistration.findUniqueOrThrow({ where: { eventId_userId: { eventId, userId } } })
          : await tx.eventRegistration.create({ data: { eventId, userId, status: 'CONFIRMADA' } });

      return this.entityMapper.toRegistrationDomain(entity);
    });
  }
}

