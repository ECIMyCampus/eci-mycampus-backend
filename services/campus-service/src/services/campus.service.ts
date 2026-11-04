import type { Building } from '../models/domain/building';
import type { Faculty } from '../models/domain/faculty';
import type { SportsFacility } from '../models/domain/sports';

export interface ICampusService {
  getBuildings(): Promise<Building[]>;
  getBuildingById(identifier: string): Promise<Building>;
  getFaculties(): Promise<Faculty[]>;
  getSportsFacilities(): Promise<SportsFacility[]>;
}
