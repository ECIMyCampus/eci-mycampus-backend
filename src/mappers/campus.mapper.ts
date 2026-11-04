import type { Building, CampusPlace, CampusService } from '../models/domain/building';
import type { Faculty } from '../models/domain/faculty';
import type { SportsFacility } from '../models/domain/sports';
import type {
  BuildingResponseDTO,
  CampusPlaceResponseDTO,
  CampusServiceResponseDTO,
  FacultyResponseDTO,
  SportsFacilityResponseDTO,
} from '../models/dto/response/campus.response.dto';

/**
 * Mapper de frontera HTTP (Domain -> ResponseDTO).
 */
export class CampusMapper {
  toPlaceResponse(place: CampusPlace): CampusPlaceResponseDTO {
    return {
      id: place.id ?? '',
      name: place.name,
      floor: place.floor,
      maxPhysicalCapacity: place.maxPhysicalCapacity,
      isActive: place.isActive,
    };
  }

  toServiceResponse(service: CampusService): CampusServiceResponseDTO {
    return {
      id: service.id ?? '',
      name: service.name,
      serviceType: service.serviceType,
      operatingHours: service.operatingHours,
      phone: service.phone,
    };
  }

  toBuildingResponse(building: Building): BuildingResponseDTO {
    return {
      id: building.id ?? '',
      code: building.code,
      name: building.name,
      description: building.description,
      svgElementId: building.svgElementId,
      imageUrl: building.imageUrl,
      floorsCount: building.floorsCount,
      academicInfo: building.academicInfo,
      isActive: building.isActive,
      places: building.places.map((p) => this.toPlaceResponse(p)),
      services: building.services.map((s) => this.toServiceResponse(s)),
    };
  }

  toFacultyResponse(faculty: Faculty): FacultyResponseDTO {
    return {
      id: faculty.id ?? '',
      name: faculty.name,
      slug: faculty.slug,
      hexColor: faculty.hexColor,
      isActive: faculty.isActive,
    };
  }

  toSportsResponse(facility: SportsFacility): SportsFacilityResponseDTO {
    return {
      id: facility.id ?? '',
      code: facility.code,
      name: facility.name,
      sportTypes: facility.sportTypes,
      svgElementId: facility.svgElementId,
      isActive: facility.isActive,
    };
  }
}
