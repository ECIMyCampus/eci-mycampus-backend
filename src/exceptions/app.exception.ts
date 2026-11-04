/**
 * Jerarquía ÚNICA de excepciones del microservicio de campus e infraestructura.
 * Cada excepción conoce su código HTTP semántico (GUIA_BACKEND §6).
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
