import type {
  Building as BuildingEntity,
  CampusPlace as CampusPlaceEntity,
  CampusService as CampusServiceEntity,
  Faculty as FacultyEntity,
  SportsFacility as SportsFacilityEntity,
} from '@prisma/client';
import { Building, CampusPlace, CampusService } from '../models/domain/building';
import { Faculty } from '../models/domain/faculty';
import { SportsFacility } from '../models/domain/sports';

type BuildingWithRelations = BuildingEntity & {
  places?: CampusPlaceEntity[];
  services?: CampusServiceEntity[];
};

/**
 * Mapper de persistencia (Domain <-> Prisma Entity).
 */
export class CampusEntityMapper {
  toPlaceDomain(entity: CampusPlaceEntity): CampusPlace {
    return new CampusPlace({
      id: entity.id,
      buildingId: entity.buildingId,
      name: entity.name,
      floor: entity.floor,
      maxPhysicalCapacity: entity.maxPhysicalCapacity,
      isActive: entity.isActive,
    });
  }

  toServiceDomain(entity: CampusServiceEntity): CampusService {
    return new CampusService({
      id: entity.id,
      name: entity.name,
      serviceType: entity.serviceType,
      operatingHours: entity.operatingHours,
      phone: entity.phone,
      buildingId: entity.buildingId,
    });
  }

  toBuildingDomain(entity: BuildingWithRelations): Building {
    return new Building({
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      svgElementId: entity.svgElementId,
      imageUrl: entity.imageUrl,
      floorsCount: entity.floorsCount,
      academicInfo: entity.academicInfo,
      isActive: entity.isActive,
      places: entity.places?.map((p) => this.toPlaceDomain(p)),
      services: entity.services?.map((s) => this.toServiceDomain(s)),
    });
  }

  toFacultyDomain(entity: FacultyEntity): Faculty {
    return new Faculty({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      hexColor: entity.hexColor,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    });
  }

  toSportsDomain(entity: SportsFacilityEntity): SportsFacility {
    return new SportsFacility({
      id: entity.id,
      code: entity.code,
      name: entity.name,
      sportTypes: entity.sportTypes,
      svgElementId: entity.svgElementId,
      isActive: entity.isActive,
    });
  }
}

