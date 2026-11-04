import { Building, CampusPlace, CampusService, type BuildingProps } from '../../../src/modules/campus/models/domain/building';
import { Faculty, type FacultyProps } from '../../../src/modules/campus/models/domain/faculty';
import { SportsFacility, type SportsFacilityProps } from '../../../src/modules/campus/models/domain/sports';
import type { ICampusRepository } from '../../../src/modules/campus/repositories/campus.repository';

export function buildBuilding(overrides: Partial<BuildingProps> = {}): Building {
  const place = new CampusPlace({
    id: 'place-1',
    buildingId: 'bld-1',
    name: 'Salón A-101',
    floor: 'Piso 1',
    maxPhysicalCapacity: 30,
    isActive: true,
  });

  const service = new CampusService({
    id: 'srv-1',
    name: 'Cafetería Central',
    serviceType: 'CAFETERIA',
    operatingHours: '07:00 - 18:00',
    phone: '1234567',
    buildingId: 'bld-1',
  });

  return new Building({
    id: 'bld-1',
    code: 'BLQ-A',
    name: 'Edificio A',
    description: 'Aulas generales y decanatura',
    svgElementId: 'ECI-BLQ-A',
    imageUrl: 'https://example.com/a.jpg',
    floorsCount: 3,
    academicInfo: 'Facultad de Sistemas',
    isActive: true,
    places: [place],
    services: [service],
    ...overrides,
  });
}

export function buildFaculty(overrides: Partial<FacultyProps> = {}): Faculty {
  return new Faculty({
    id: 'fac-1',
    name: 'Ingeniería de Sistemas',
    slug: 'sistemas',
    hexColor: '#8B0000',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

export function buildSportsFacility(overrides: Partial<SportsFacilityProps> = {}): SportsFacility {
  return new SportsFacility({
    id: 'sport-1',
    code: 'CANCHA-FUTBOL',
    name: 'Cancha de Fútbol 11',
    sportTypes: ['Fútbol', 'Ultimate'],
    svgElementId: 'ECI-SPORT-FUTBOL',
    isActive: true,
    ...overrides,
  });
}

export class InMemoryCampusRepository implements ICampusRepository {
  readonly buildings = new Map<string, Building>();
  readonly faculties = new Map<string, Faculty>();
  readonly sports = new Map<string, SportsFacility>();

  async findActiveBuildings(): Promise<Building[]> {
    return [...this.buildings.values()].filter((b) => b.isActive);
  }

  async findBuildingByIdOrCode(identifier: string): Promise<Building | null> {
    for (const b of this.buildings.values()) {
      if (b.isActive && (b.id === identifier || b.code === identifier || b.svgElementId === identifier)) {
        return b;
      }
    }
    return null;
  }

  async findActiveFaculties(): Promise<Faculty[]> {
    return [...this.faculties.values()].filter((f) => f.isActive);
  }

  async findActiveSportsFacilities(): Promise<SportsFacility[]> {
    return [...this.sports.values()].filter((s) => s.isActive);
  }
}

