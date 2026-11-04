import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { CampusApi } from '../controllers/docs/campus.api';
import type { CampusController } from '../controllers/campus.controller';
import type { BuildingParamsDTO } from '../models/dto/request/campus.request.dto';

export function campusRoutes(controller: CampusController) {
  return async (fastify: FastifyInstance) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.get('/buildings', { schema: CampusApi.getBuildings }, controller.getBuildings);
    app.get<{ Params: BuildingParamsDTO }>('/buildings/:id', { schema: CampusApi.getBuildingById }, controller.getBuildingById);
    app.get('/faculties', { schema: CampusApi.getFaculties }, controller.getFaculties);
    app.get('/sports', { schema: CampusApi.getSportsFacilities }, controller.getSportsFacilities);
  };
}
