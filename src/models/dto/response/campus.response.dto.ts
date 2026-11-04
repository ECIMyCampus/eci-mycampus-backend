import { z } from 'zod';
import { CAMPUS_SERVICE_TYPES } from '../../domain/building';

export const CampusPlaceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  floor: z.string(),
  maxPhysicalCapacity: z.number().int(),
  isActive: z.boolean(),
});

export const CampusServiceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  serviceType: z.enum(CAMPUS_SERVICE_TYPES),
  operatingHours: z.string().nullable(),
  phone: z.string().nullable(),
});

export const BuildingResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  svgElementId: z.string(),
  imageUrl: z.string().nullable(),
  floorsCount: z.number().int(),
  academicInfo: z.string().nullable(),
  isActive: z.boolean(),
  places: z.array(CampusPlaceResponseSchema).optional(),
  services: z.array(CampusServiceResponseSchema).optional(),
});

export const FacultyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  hexColor: z.string(),
  isActive: z.boolean(),
});

export const SportsFacilityResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  sportTypes: z.array(z.string()),
  svgElementId: z.string(),
  isActive: z.boolean(),
});

export type CampusPlaceResponseDTO = z.infer<typeof CampusPlaceResponseSchema>;
export type CampusServiceResponseDTO = z.infer<typeof CampusServiceResponseSchema>;
export type BuildingResponseDTO = z.infer<typeof BuildingResponseSchema>;
export type FacultyResponseDTO = z.infer<typeof FacultyResponseSchema>;
export type SportsFacilityResponseDTO = z.infer<typeof SportsFacilityResponseSchema>;
