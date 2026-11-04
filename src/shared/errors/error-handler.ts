import { STATUS_CODES } from 'node:http';
import { Prisma } from '@prisma/client';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod';
import { AppException } from './app.exception';
import { buildErrorResponse, type ErrorResponseDTO } from './error.response.dto';

/** Textos propios de cada módulo: forman parte del contrato con el cliente (ADR-006). */
export interface ErrorMessages {
  validation: string;
  serialization: string;
  uniqueConflict: string;
  recordNotFound: string;
}

export const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  validation: 'La solicitud contiene datos inválidos.',
  serialization: 'Ocurrió un error inesperado.',
  uniqueConflict: 'El recurso ya existe o entra en conflicto con otro.',
  recordNotFound: 'El recurso solicitado no existe.',
};

/**
 * ÚNICO punto que traduce excepciones a HTTP. Se registra en el ámbito encapsulado
 * de cada módulo. Los controladores no contienen try/catch.
 */
export function registerErrorHandler(app: FastifyInstance, messages: ErrorMessages = DEFAULT_ERROR_MESSAGES): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const body = toErrorResponse(error, request, messages);
    if (body.status >= 500) {
      request.log.error({ err: error }, 'Error no controlado');
    }
    return reply.status(body.status).send(body);
  });
}

export function registerNotFoundHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    const body = buildErrorResponse(404, 'Not Found', `Ruta ${request.method} ${request.url} no existe.`, request.url);
    return reply.status(404).send(body);
  });
}

function toErrorResponse(error: FastifyError, request: FastifyRequest, messages: ErrorMessages): ErrorResponseDTO {
  const path = request.url;

  // 4xx de dominio
  if (error instanceof AppException) {
    return buildErrorResponse(error.statusCode, error.error, error.message, path);
  }

  // 400: fallo de validación Zod en params / query / body
  if (hasZodFastifySchemaValidationErrors(error)) {
    const detalles = error.validation.map((issue) => ({
      campo: [error.validationContext, ...String(issue.instancePath).split('/').filter(Boolean)].join('.'),
      mensaje: issue.message ?? 'Valor inválido',
    }));
    return buildErrorResponse(400, 'Bad Request', messages.validation, path, detalles);
  }

  // 500: la respuesta no cumple su propio contrato (bug del servidor)
  if (isResponseSerializationError(error)) {
    return buildErrorResponse(500, 'Internal Server Error', messages.serialization, path);
  }

  // Restricciones de base de datos que se escapan por concurrencia
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return buildErrorResponse(409, 'Conflict', messages.uniqueConflict, path);
    }
    if (error.code === 'P2025') {
      return buildErrorResponse(404, 'Not Found', messages.recordNotFound, path);
    }
  }

  // 4xx propios de Fastify (JSON malformado, payload demasiado grande, content-type...)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return buildErrorResponse(error.statusCode, STATUS_CODES[error.statusCode] ?? 'Bad Request', error.message, path);
  }

  // Fallback 500: nunca se filtra el mensaje interno
  return buildErrorResponse(500, 'Internal Server Error', 'Ocurrió un error inesperado.', path);
}
