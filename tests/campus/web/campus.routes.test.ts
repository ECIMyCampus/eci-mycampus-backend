import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../../src/app';
import { campusHttpModule } from '../../../src/modules/campus/module';
import type { AppConfig } from '../../../src/config/env';
import { CampusMapper } from '../../../src/modules/campus/mappers/campus.mapper';
import { CampusServiceImpl } from '../../../src/modules/campus/services/impl/campus.service.impl';
import {
  buildBuilding,
  buildFaculty,
  buildSportsFacility,
  InMemoryCampusRepository,
} from '../support/fixtures';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  jwtSecret: 'test_jwt_secret_with_sufficient_length_123',
  corsOrigin: true,
  emailFrom: 'test@ecimycampus.dev',
};

describe('Campus API (Endpoints y Manejo de Errores)', () => {
  let app: FastifyInstance;
  let repository: InMemoryCampusRepository;

  beforeEach(async () => {
    repository = new InMemoryCampusRepository();
    const service = new CampusServiceImpl(repository);
    const mapper = new CampusMapper();

    app = await buildApp(config, () => ({
      modules: [campusHttpModule({ campusService: service, campusMapper: mapper })],
      dispose: async () => {},
    }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health responde 200 con status ok', async () => {
    // Act
    const res = await app.inject({ method: 'GET', url: '/health' });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'eci-mycampus-backend' });
  });

  describe('GET /api/v1/campus/buildings', () => {
    it('retorna 200 y la lista de edificios activos', async () => {
      // Arrange
      const b = buildBuilding();
      repository.buildings.set(b.id!, b);

      // Act
      const res = await app.inject({ method: 'GET', url: '/api/v1/campus/buildings' });

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(1);
      expect(res.json()[0]).toMatchObject({
        code: 'BLQ-A',
        name: 'Edificio A',
        places: expect.any(Array),
        services: expect.any(Array),
      });
    });
  });

  describe('GET /api/v1/campus/buildings/:id', () => {
    it('retorna 200 con el detalle del edificio solicitado', async () => {
      // Arrange
      const b = buildBuilding();
      repository.buildings.set(b.id!, b);

      // Act
      const res = await app.inject({ method: 'GET', url: `/api/v1/campus/buildings/${b.code}` });

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        id: b.id,
        code: 'BLQ-A',
      });
    });

    it('retorna 404 si el edificio no existe', async () => {
      // Act
      const res = await app.inject({ method: 'GET', url: '/api/v1/campus/buildings/BLQ-INEXISTENTE' });

      // Assert
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({
        status: 404,
        error: 'Not Found',
      });
    });
  });

  describe('GET /api/v1/campus/faculties', () => {
    it('retorna 200 y la lista de facultades', async () => {
      // Arrange
      const f = buildFaculty();
      repository.faculties.set(f.id!, f);

      // Act
      const res = await app.inject({ method: 'GET', url: '/api/v1/campus/faculties' });

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(1);
      expect(res.json()[0]).toMatchObject({
        name: 'Ingeniería de Sistemas',
        hexColor: '#8B0000',
      });
    });
  });

  describe('GET /api/v1/campus/sports', () => {
    it('retorna 200 y la lista de escenarios deportivos', async () => {
      // Arrange
      const s = buildSportsFacility();
      repository.sports.set(s.id!, s);

      // Act
      const res = await app.inject({ method: 'GET', url: '/api/v1/campus/sports' });

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(1);
      expect(res.json()[0]).toMatchObject({
        code: 'CANCHA-FUTBOL',
        sportTypes: ['Fútbol', 'Ultimate'],
      });
    });
  });
});

