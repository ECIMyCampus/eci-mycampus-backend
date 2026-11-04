import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CampusMapper } from '../mappers/campus.mapper';
import type { BuildingParamsDTO } from '../models/dto/request/campus.request.dto';
import type { ICampusService } from '../services/campus.service';

export class CampusController {
  constructor(
    private readonly campusService: ICampusService,
    private readonly mapper: CampusMapper,
  ) {}

  getBuildings = async (_request: FastifyRequest, reply: FastifyReply) => {
    const buildings = await this.campusService.getBuildings();
    return reply.status(200).send(buildings.map((b) => this.mapper.toBuildingResponse(b)));
  };

  getBuildingById = async (
    request: FastifyRequest<{ Params: BuildingParamsDTO }>,
    reply: FastifyReply,
  ) => {
    const building = await this.campusService.getBuildingById(request.params.id);
    return reply.status(200).send(this.mapper.toBuildingResponse(building));
  };

  getFaculties = async (_request: FastifyRequest, reply: FastifyReply) => {
    const faculties = await this.campusService.getFaculties();
    return reply.status(200).send(faculties.map((f) => this.mapper.toFacultyResponse(f)));
  };

  getSportsFacilities = async (_request: FastifyRequest, reply: FastifyReply) => {
    const facilities = await this.campusService.getSportsFacilities();
    return reply.status(200).send(facilities.map((s) => this.mapper.toSportsResponse(s)));
  };
}
