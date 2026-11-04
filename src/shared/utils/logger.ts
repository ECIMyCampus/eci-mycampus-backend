/** Abstracción mínima de logging para no acoplar las capas internas a pino/Fastify. */
export interface AppLogger {
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
}
