import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';
import { ForbiddenException, UnauthorizedException } from '../errors/app.exception';
import { JwtClaimsSchema, type Actor, type UserRole } from './identity';

declare module 'fastify' {
  interface FastifyRequest {
    /** Usuario autenticado o `null` si la petición es anónima. */
    actor: Actor | null;
  }
}

/**
 * Autenticación OPCIONAL: si llega un Bearer válido se adjunta `request.actor`;
 * si no, la petición continúa como visitante. La autorización la imponen los guards.
 */
export const authenticationPlugin = fp(async (fastify) => {
  fastify.decorateRequest('actor', null);

  fastify.addHook('onRequest', async (request) => {
    if (!request.headers.authorization) return;
    try {
      const claims = JwtClaimsSchema.parse(await request.jwtVerify());
      request.actor = {
        id: claims.id,
        email: claims.email ?? null,
        fullName: claims.fullName ?? null,
        role: claims.role,
        facultyId: claims.facultyId ?? null,
        isAuthorizedOrganizer: claims.isAuthorizedOrganizer ?? false,
      };
    } catch (err) {
      request.log.debug({ err }, 'Token inválido o expirado; se continúa como visitante');
    }
  });
});

/** Guard equivalente a `isAuthenticated()`. */
export const requireAuth: preHandlerAsyncHookHandler = async (request: FastifyRequest, _reply: FastifyReply) => {
  if (!request.actor) throw new UnauthorizedException();
};

/** Guard RBAC equivalente a `@PreAuthorize("hasAnyRole(...)")`. */
export function requireRoles(...roles: UserRole[]): preHandlerAsyncHookHandler {
  const allowed = new Set(roles);
  return async (request: FastifyRequest) => {
    if (!request.actor) throw new UnauthorizedException();
    if (!allowed.has(request.actor.role)) {
      throw new ForbiddenException(`Esta acción requiere uno de los roles: ${roles.join(', ')}.`);
    }
  };
}

/** Devuelve el actor autenticado. Usar solo en rutas protegidas por un guard. */
export function currentActor(request: FastifyRequest): Actor {
  if (!request.actor) throw new UnauthorizedException();
  return request.actor;
}
