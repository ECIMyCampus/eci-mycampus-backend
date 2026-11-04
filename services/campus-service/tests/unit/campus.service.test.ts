import { beforeEach, describe, expect, it } from 'vitest';
import { ResourceNotFoundException } from '../../src/exceptions/app.exception';
import { CampusServiceImpl } from '../../src/services/impl/campus.service.impl';
import {
  buildBuilding,
  buildFaculty,
  buildSportsFacility,
  InMemoryCampusRepository,
} from '../support/fixtures';

describe('CampusServiceImpl', () => {
  let repository: InMemoryCampusRepository;
  let service: CampusServiceImpl;

  beforeEach(() => {
    repository = new InMemoryCampusRepository();
    service = new CampusServiceImpl(repository);
  });

  describe('getBuildings', () => {
    it('obtiene la lista de edificios activos', async () => {
      // Arrange
      const b1 = buildBuilding();
      const b2 = buildBuilding({ id: 'bld-2', code: 'BLQ-B', isActive: false });
      repository.buildings.set(b1.id!, b1);
      repository.buildings.set(b2.id!, b2);

      // Act
      const result = await service.getBuildings();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('BLQ-A');
    });
  });

  describe('getBuildingById', () => {
    it('encuentra el edificio por ID, código o svgElementId', async () => {
      // Arrange
      const b = buildBuilding();
      repository.buildings.set(b.id!, b);

      // Act & Assert
      expect((await service.getBuildingById(b.id!)).name).toBe(b.name);
      expect((await service.getBuildingById(b.code)).name).toBe(b.name);
      expect((await service.getBuildingById(b.svgElementId)).name).toBe(b.name);
    });

    it('lanza 404 si el edificio no existe', async () => {
      // Act + Assert
      await expect(service.getBuildingById('no-existe')).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('getFaculties', () => {
    it('obtiene las facultades activas', async () => {
      // Arrange
      const f1 = buildFaculty();
      const f2 = buildFaculty({ id: 'fac-2', name: 'Inactiva', isActive: false });
      repository.faculties.set(f1.id!, f1);
      repository.faculties.set(f2.id!, f2);

      // Act
      const result = await service.getFaculties();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ingeniería de Sistemas');
    });
  });

  describe('getSportsFacilities', () => {
    it('obtiene los escenarios deportivos activos', async () => {
      // Arrange
      const s = buildSportsFacility();
      repository.sports.set(s.id!, s);

      // Act
      const result = await service.getSportsFacilities();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('CANCHA-FUTBOL');
    });
  });
});

