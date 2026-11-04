/**
 * Jerarquía ÚNICA de excepciones del backend.
 * Cada excepción conoce su código HTTP semántico; el manejador de errores
 * es el único punto que las traduce a un ErrorResponseDTO.
 *
 *  400 BadRequestException          -> datos malformados (normalmente lo lanza Zod en la frontera)
 *  401 UnauthorizedException        -> sin token o token inválido
 *  403 ForbiddenException           -> autenticado pero sin permisos
 *  404 ResourceNotFoundException    -> entidad inexistente
 *  409 ConflictException            -> colisión de unicidad / recurso agotado
 *  422 BusinessRuleException        -> regla de negocio violada
 *  422 InvalidStateException        -> transición de estado ilegal
 */
export abstract class AppException extends Error {
  abstract readonly statusCode: number;
  abstract readonly error: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestException extends AppException {
  readonly statusCode = 400;
  readonly error = 'Bad Request';
  constructor(message = 'La solicitud contiene datos inválidos.') {
    super(message);
  }
}

export class UnauthorizedException extends AppException {
  readonly statusCode = 401;
  readonly error = 'Unauthorized';
  constructor(message = 'Debes iniciar sesión para realizar esta acción.') {
    super(message);
  }
}

export class ForbiddenException extends AppException {
  readonly statusCode = 403;
  readonly error = 'Forbidden';
  constructor(message = 'No tienes permisos para realizar esta acción.') {
    super(message);
  }
}

export class ResourceNotFoundException extends AppException {
  readonly statusCode = 404;
  readonly error = 'Not Found';
  constructor(message: string) {
    super(message);
  }
}

export class ConflictException extends AppException {
  readonly statusCode = 409;
  readonly error = 'Conflict';
  constructor(message: string) {
    super(message);
  }
}

export class BusinessRuleException extends AppException {
  readonly statusCode = 422;
  readonly error = 'Unprocessable Entity';
  constructor(message: string) {
    super(message);
  }
}

export class InvalidStateException extends AppException {
  readonly statusCode = 422;
  readonly error = 'Unprocessable Entity';
  constructor(message: string) {
    super(message);
  }
}
