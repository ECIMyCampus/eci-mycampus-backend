import { STATUS_CODES } from 'node:http';
import { Prisma } from '@prisma/client';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod';
import { buildErrorResponse, type ErrorResponseDTO } from '../models/dto/response/error.response.dto';
import { AppException } from './app.exception';

/**
 * Equivalente al @RestControllerAdvice: ÚNICO punto que traduce excepciones a HTTP.
 * Los controladores no contienen try/catch.
 */
export function registerGlobalErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const body = toErrorResponse(error, request);
    if (body.status >= 500) {
      request.log.error({ err: error }, 'Error no controlado');
    }
    return reply.status(body.status).send(body);
  });

  app.setNotFoundHandler((request, reply) => {
    const body = buildErrorResponse(404, 'Not Found', `Ruta ${request.method} ${request.url} no existe.`, request.url);
    return reply.status(404).send(body);
  });
}

function toErrorResponse(error: FastifyError, request: FastifyRequest): ErrorResponseDTO {
  const path = request.url;

  // 4xx de dominio (401, 403, 404, 409, 422)
  if (error instanceof AppException) {
    return buildErrorResponse(error.statusCode, error.error, error.message, path);
  }

  // 400: fallo de validación Zod en params / query / body
  if (hasZodFastifySchemaValidationErrors(error)) {
    const detalles = error.validation.map((issue) => ({
      campo: [error.validationContext, ...String(issue.instancePath).split('/').filter(Boolean)].join('.'),
      mensaje: issue.message ?? 'Valor inválido',
    }));
    return buildErrorResponse(400, 'Bad Request', 'La solicitud contiene datos inválidos.', path, detalles);
  }

  // 500: la respuesta no cumple su propio contrato (bug del servidor)
  if (isResponseSerializationError(error)) {
    return buildErrorResponse(500, 'Internal Server Error', 'Ocurrió un error inesperado.', path);
  }

  // Restricciones de base de datos que se escapan por concurrencia
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return buildErrorResponse(409, 'Conflict', 'El recurso ya existe o entra en conflicto con otro.', path);
    }
    if (error.code === 'P2025') {
      return buildErrorResponse(404, 'Not Found', 'El recurso solicitado no existe.', path);
    }
  }

  // 4xx propios de Fastify (JSON malformado, payload demasiado grande, content-type...)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return buildErrorResponse(error.statusCode, STATUS_CODES[error.statusCode] ?? 'Bad Request', error.message, path);
  }

  // Fallback 500: nunca se filtra el mensaje interno
  return buildErrorResponse(500, 'Internal Server Error', 'Ocurrió un error inesperado.', path);
}
