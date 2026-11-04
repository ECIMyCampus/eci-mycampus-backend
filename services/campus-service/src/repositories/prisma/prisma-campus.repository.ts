import type { PrismaClient } from '@prisma/client';
import { CampusEntityMapper } from '../../mappers/campus-entity.mapper';
import type { Building } from '../../models/domain/building';
import type { Faculty } from '../../models/domain/faculty';
import type { SportsFacility } from '../../models/domain/sports';
import type { ICampusRepository } from '../campus.repository';

export class PrismaCampusRepository implements ICampusRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly entityMapper: CampusEntityMapper,
  ) {}

  async findActiveBuildings(): Promise<Building[]> {
    const entities = await this.prisma.building.findMany({
      where: { isActive: true },
      include: {
        places: { where: { isActive: true } },
        services: true,
      },
      orderBy: { code: 'asc' },
    });

    return entities.map((b) => this.entityMapper.toBuildingDomain(b));
  }

  async findBuildingByIdOrCode(identifier: string): Promise<Building | null> {
    const entity = await this.prisma.building.findFirst({
      where: {
        OR: [{ id: identifier }, { code: identifier }, { svgElementId: identifier }],
        isActive: true,
      },
      include: {
        places: true,
        services: true,
      },
    });

    return entity ? this.entityMapper.toBuildingDomain(entity) : null;
  }

  async findActiveFaculties(): Promise<Faculty[]> {
    const entities = await this.prisma.faculty.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return entities.map((f) => this.entityMapper.toFacultyDomain(f));
  }

  async findActiveSportsFacilities(): Promise<SportsFacility[]> {
    const entities = await this.prisma.sportsFacility.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return entities.map((s) => this.entityMapper.toSportsDomain(s));
  }
}

