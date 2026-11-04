import type { PrismaClient } from '@prisma/client';
import { EventEntityMapper } from '../../mappers/event-entity.mapper';
import type { Event } from '../../models/domain/event';
import type { EventWithStats, RadarCriteria } from '../../models/domain/types';
import type { IEventRepository } from '../event.repository';
import { EventSpecs } from '../spec/event.specs';

export class PrismaEventRepository implements IEventRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly entityMapper: EventEntityMapper,
  ) {}

  async findById(id: string): Promise<Event | null> {
    const entity = await this.prisma.event.findUnique({ where: { id } });
    return entity ? this.entityMapper.toDomain(entity) : null;
  }

  async findRadar(criteria: RadarCriteria, now: Date): Promise<EventWithStats[]> {
    const rows = await this.prisma.event.findMany({
      where: EventSpecs.radar(criteria, now),
      include: {
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMADA' } },
            favorites: true,
          },
        },
      },
      orderBy: [{ startTime: 'asc' }, { title: 'asc' }],
      take: criteria.limit,
    });

    return rows.map(({ _count, ...entity }) => ({
      event: this.entityMapper.toDomain(entity),
      registrationsCount: _count.registrations,
      favoritesCount: _count.favorites,
    }));
  }

  async create(event: Event): Promise<Event> {
    const entity = await this.prisma.event.create({ data: this.entityMapper.toCreateData(event) });
    return this.entityMapper.toDomain(entity);
  }

  async updateStatus(event: Event): Promise<Event> {
    const entity = await this.prisma.event.update({
      where: { id: event.id },
      data: this.entityMapper.toStatusUpdateData(event),
    });
    return this.entityMapper.toDomain(entity);
  }
}

