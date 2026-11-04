import { z } from 'zod';
import { BuildingParamsSchema } from '../../models/dto/request/campus.request.dto';
import {
  BuildingResponseSchema,
  FacultyResponseSchema,
  SportsFacilityResponseSchema,
} from '../../models/dto/response/campus.response.dto';
import { ErrorResponseSchema } from '../../models/dto/response/error.response.dto';

const TAG = ['Campus e Infraestructura'];

const errors = {
  400: ErrorResponseSchema.describe('Identificador inválido'),
  404: ErrorResponseSchema.describe('Edificio no encontrado'),
  500: ErrorResponseSchema.describe('Error interno del servidor'),
};

export const CampusApi = {
  getBuildings: {
    tags: TAG,
    summary: 'Listar edificios del campus',
    description: 'Devuelve todos los edificios activos con sus respectivos salones y servicios.',
    response: {
      200: z.array(BuildingResponseSchema),
    },
  },

  getBuildingById: {
    tags: TAG,
    summary: 'Consultar detalle de un edificio',
    description: 'Búsqueda por UUID, código de bloque (ej. BLQ-A) o identificador de elemento SVG.',
    params: BuildingParamsSchema,
    response: {
      200: BuildingResponseSchema,
      400: errors[400],
      404: errors[404],
    },
  },

  getFaculties: {
    tags: TAG,
    summary: 'Listar facultades del campus',
    description: 'Lista de facultades activas con su paleta de color institucional.',
    response: {
      200: z.array(FacultyResponseSchema),
    },
  },

  getSportsFacilities: {
    tags: TAG,
    summary: 'Listar escenarios deportivos',
    description: 'Lista de canchas, polideportivos y gimnasios del campus.',
    response: {
      200: z.array(SportsFacilityResponseSchema),
    },
  },
} as const;

