import { z } from 'zod';

/** Formato ÚNICO e inmutable de error para toda la API. */
export const ErrorResponseSchema = z.object({
  status: z.number().int(),
  error: z.string(),
  mensaje: z.string(),
  path: z.string(),
  timestamp: z.string(),
  detalles: z
    .array(z.object({ campo: z.string(), mensaje: z.string() }))
    .optional()
    .describe('Solo presente en errores de validación (400)'),
});

export type ErrorResponseDTO = Readonly<z.infer<typeof ErrorResponseSchema>>;

export function buildErrorResponse(
  status: number,
  error: string,
  mensaje: string,
  path: string,
  detalles?: ErrorResponseDTO['detalles'],
): ErrorResponseDTO {
  return Object.freeze({
    status,
    error,
    mensaje,
    path,
    timestamp: new Date().toISOString(),
    ...(detalles && detalles.length > 0 ? { detalles } : {}),
  });
}
