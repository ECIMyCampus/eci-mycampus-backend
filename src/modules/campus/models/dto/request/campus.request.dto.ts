import { z } from 'zod';

export const BuildingParamsSchema = z.object({
  id: z.string().trim().min(1, 'El identificador o código de edificio es obligatorio'),
});

export type BuildingParamsDTO = z.infer<typeof BuildingParamsSchema>;

