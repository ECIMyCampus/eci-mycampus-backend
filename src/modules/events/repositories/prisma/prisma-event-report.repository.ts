import type { PrismaClient } from '@prisma/client';
import { EventEntityMapper } from '../../mappers/event-entity.mapper';
import type { EventReport } from '../../models/domain/types';
import type { IEventReportRepository } from '../event.repository';

export class PrismaEventReportRepository implements IEventReportRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly entityMapper: EventEntityMapper,
  ) {}

  async existsByEventAndReporter(eventId: string, reporterUserId: string): Promise<boolean> {
    const count = await this.prisma.eventReport.count({ where: { eventId, reporterUserId } });
    return count > 0;
  }

  async create(report: EventReport): Promise<EventReport> {
    const entity = await this.prisma.eventReport.create({
      data: {
        eventId: report.eventId,
        reporterUserId: report.reporterUserId,
        reason: report.reason,
        description: report.description,
        status: report.status,
      },
    });
    return this.entityMapper.toReportDomain(entity);
  }
}

