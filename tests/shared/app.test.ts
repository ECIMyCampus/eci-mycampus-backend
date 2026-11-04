import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { buildApp } from '../../src/app';
import type { AppConfig } from '../../src/config/env';
import { BusinessRuleException } from '../../src/shared/errors/app.exception';
import { DEFAULT_ERROR_MESSAGES, type ErrorMessages } from '../../src/shared/errors/error-handler';
import { currentActor, requireAuth, requireRoles } from '../../src/shared/security/auth.guard';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  jwtSecret: 'test_secret_with_more_than_16_chars',
  corsOrigin: true,
  emailFrom: 'test@ecimycampus.dev',
};

const customMessages: ErrorMessages = {
  validation: 'validación propia',
  serialization: 'serialización propia',
  uniqueConflict: 'conflicto propio',
  recordNotFound: 'registro propio',
};

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('fallo', { code, clientVersion: 'test' });

async function probeRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.get('/rule', async () => {
    throw new BusinessRuleException('regla');
  });
  app.get('/unique', async () => {
    throw prismaError('P2002');
  });
  app.get('/missing', async () => {
    throw prismaError('P2025');
  });
  app.get('/boom', async () => {
    throw new Error('detalle interno');
  });
  app.get('/query', { schema: { querystring: z.object({ n: z.coerce.number() }) } }, async () => ({ ok: true }));
  app.get(
    '/bad-output',
    { schema: { response: { 200: z.object({ n: z.number() }) } } },
    async () => ({ n: 'no-numero' }) as unknown as { n: number },
  );
  app.post('/json', async () => ({ ok: true }));
  app.get('/private', { preHandler: requireAuth }, async (request) => ({ id: currentActor(request).id }));
  app.get('/admin', { preHandler: requireRoles('ADMIN') }, async () => ({ ok: true }));
}

describe('buildApp (núcleo del monolito)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp(config, () => ({
      modules: [{ prefix: '/probe', routes: probeRoutes, errorMessages: customMessages }],
      dispose: async () => {},
    }));
  });

  afterEach(async () => {
    await app.close();
  });

  const get = (url: string, authorization?: string) =>
    app.inject({ method: 'GET', url, headers: authorization ? { authorization } : {} });

  it('GET /health identifica al único proceso', async () => {
    const res = await get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'eci-mycampus-backend' });
  });

  it('GET /docs/json publica el contrato OpenAPI', async () => {
    const res = await get('/docs/json');
    expect(res.statusCode).toBe(200);
    expect(res.json().info.title).toBe('ECI-MyCampus API');
  });

  it('ruta inexistente responde con ErrorResponseDTO', async () => {
    const res = await get('/no-existe');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ status: 404, error: 'Not Found', path: '/no-existe' });
  });

  it('traduce excepciones de dominio', async () => {
    const res = await get('/probe/rule');
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ error: 'Unprocessable Entity', mensaje: 'regla' });
  });

  it('usa los mensajes del módulo para errores de validación y de base de datos', async () => {
    const validation = await get('/probe/query?n=abc');
    expect(validation.statusCode).toBe(400);
    expect(validation.json().mensaje).toBe(customMessages.validation);
    expect(validation.json().detalles[0].campo).toBe('querystring.n');

    const unique = await get('/probe/unique');
    expect(unique.statusCode).toBe(409);
    expect(unique.json().mensaje).toBe(customMessages.uniqueConflict);

    const missing = await get('/probe/missing');
    expect(missing.statusCode).toBe(404);
    expect(missing.json().mensaje).toBe(customMessages.recordNotFound);

    const output = await get('/probe/bad-output');
    expect(output.statusCode).toBe(500);
    expect(output.json().mensaje).toBe(customMessages.serialization);
  });

  it('no filtra el mensaje interno en errores inesperados', async () => {
    const res = await get('/probe/boom');
    expect(res.statusCode).toBe(500);
    expect(res.body).not.toContain('detalle interno');
  });

  it('responde 400 con el contrato de error ante JSON malformado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/probe/json',
      headers: { 'content-type': 'application/json' },
      payload: '{mal',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ status: 400, error: 'Bad Request' });
  });

  it('aplica los guards compartidos', async () => {
    const student = `Bearer ${app.jwt.sign({ id: 'u1', role: 'ESTUDIANTE' })}`;
    const invalidClaims = `Bearer ${app.jwt.sign({ id: 'u1', role: 'INEXISTENTE' })}`;

    expect((await get('/probe/private')).statusCode).toBe(401);
    expect((await get('/probe/private', 'Bearer basura')).statusCode).toBe(401);
    expect((await get('/probe/private', invalidClaims)).statusCode).toBe(401);
    expect((await get('/probe/private', student)).json()).toEqual({ id: 'u1' });
    expect((await get('/probe/admin')).statusCode).toBe(401);
    expect((await get('/probe/admin', student)).statusCode).toBe(403);
  });

  it('el preflight CORS admite PATCH, que usan las rutas de moderación', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/probe/rule',
      headers: { origin: 'http://cliente.test', 'access-control-request-method': 'PATCH' },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('PATCH');
  });

  it('los mensajes por defecto siguen disponibles', () => {
    expect(DEFAULT_ERROR_MESSAGES.validation).toBe('La solicitud contiene datos inválidos.');
  });
});
