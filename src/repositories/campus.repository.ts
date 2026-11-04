import type { Building } from '../models/domain/building';
import type { Faculty } from '../models/domain/faculty';
import type { SportsFacility } from '../models/domain/sports';

export interface ICampusRepository {
  findActiveBuildings(): Promise<Building[]>;
  findBuildingByIdOrCode(identifier: string): Promise<Building | null>;
  findActiveFaculties(): Promise<Faculty[]>;
  findActiveSportsFacilities(): Promise<SportsFacility[]>;
}
