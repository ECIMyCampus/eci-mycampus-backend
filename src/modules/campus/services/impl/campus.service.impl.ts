import { ResourceNotFoundException } from '../../../../shared/errors/app.exception';
import type { Building } from '../../models/domain/building';
import type { Faculty } from '../../models/domain/faculty';
import type { SportsFacility } from '../../models/domain/sports';
import type { ICampusRepository } from '../../repositories/campus.repository';
import type { ICampusService } from '../campus.service';

export class CampusServiceImpl implements ICampusService {
  constructor(private readonly campusRepository: ICampusRepository) {}

  async getBuildings(): Promise<Building[]> {
    return this.campusRepository.findActiveBuildings();
  }

  async getBuildingById(identifier: string): Promise<Building> {
    const building = await this.campusRepository.findBuildingByIdOrCode(identifier);
    if (!building) {
      throw new ResourceNotFoundException(`Edificio con identificador o código '${identifier}' no encontrado.`);
    }
    return building;
  }

  async getFaculties(): Promise<Faculty[]> {
    return this.campusRepository.findActiveFaculties();
  }

  async getSportsFacilities(): Promise<SportsFacility[]> {
    return this.campusRepository.findActiveSportsFacilities();
  }
}

