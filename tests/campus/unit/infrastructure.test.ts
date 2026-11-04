import { describe, expect, it } from 'vitest';
import {
  BadRequestException,
  BusinessRuleException,
  ConflictException,
  ResourceNotFoundException,
} from '../../../src/shared/errors/app.exception';
import { CampusEntityMapper } from '../../../src/modules/campus/mappers/campus-entity.mapper';

describe('CampusEntityMapper (Domain <-> Prisma)', () => {
  const mapper = new CampusEntityMapper();

  it('mapea correctamente entidad Building de Prisma a dominio', () => {
    // Arrange
    const entity = {
      id: 'b-1',
      code: 'BLQ-A',
      name: 'Bloque A',
      description: 'Aulas',
      svgElementId: 'ECI-BLQ-A',
      imageUrl: null,
      floorsCount: 2,
      academicInfo: null,
      isActive: true,
      universityId: 'ECI',
      places: [
        {
          id: 'p-1',
          buildingId: 'b-1',
          name: 'A-101',
          floor: '1',
          maxPhysicalCapacity: 25,
          isActive: true,
        },
      ],
      services: [
        {
          id: 's-1',
          name: 'Café',
          serviceType: 'CAFETERIA' as const,
          operatingHours: '08:00 - 17:00',
          phone: null,
          buildingId: 'b-1',
        },
      ],
    };

    // Act
    const domain = mapper.toBuildingDomain(entity);

    // Assert
    expect(domain.code).toBe('BLQ-A');
    expect(domain.places).toHaveLength(1);
    expect(domain.services).toHaveLength(1);
  });
});

describe('AppException hierarchy', () => {
  it('instancia correctamente cada subclase semántica con su código HTTP', () => {
    expect(new BadRequestException().statusCode).toBe(400);
    expect(new ResourceNotFoundException('no').statusCode).toBe(404);
    expect(new ConflictException('conflict').statusCode).toBe(409);
    expect(new BusinessRuleException('rule').statusCode).toBe(422);
  });
});

