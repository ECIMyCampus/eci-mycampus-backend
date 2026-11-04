import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp, type AppContainer } from '../../src/app';
import { loadConfig, type AppConfig } from '../../src/config/env';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://unused',
  jwtSecret: 'test_secret_with_more_than_16_chars',
  corsOrigin: false,
  emailFrom: 'test@ecimycampus.dev',
};

const FORWARDED = { 'x-forwarded-for': '203.0.113.7' };

describe('Soporte de despliegue detrás de un proxy (Azure)', () => {
  let app: FastifyInstance;

  const start = async (overrides: Partial<AppConfig> = {}, container: Partial<AppContainer> = {}) => {
    app = await buildApp({ ...config, ...overrides }, () => ({
      modules: [
        {
          prefix: '/probe',
          routes: async (fastify) => {
            fastify.get('/ip', async (request) => ({ ip: request.ip }));
          },
          errorMessages: {
            validation: 'v',
            serialization: 's',
            uniqueConflict: 'u',
            recordNotFound: 'r',
          },
        },
      ],
      dispose: async () => {},
      ...container,
    }));
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /health/ready responde 200 si las dependencias están disponibles', async () => {
    await start({}, { checkReadiness: async () => {} });

    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready' });
  });

  it('GET /health/ready responde 503 sin filtrar el error interno', async () => {
    await start({}, {
      checkReadiness: async () => {
        throw new Error('password authentication failed for user admin');
      },
    });

    const res = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 503, error: 'Service Unavailable' });
    expect(res.body).not.toContain('password');
  });

  it('GET /health sigue respondiendo aunque la base de datos no esté lista', async () => {
    await start({}, {
      checkReadiness: async () => {
        throw new Error('sin conexión');
      },
    });

    expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200);
  });

  it('con trustProxy usa la IP real del cliente para auditoría', async () => {
    await start({ trustProxy: true });

    const res = await app.inject({ method: 'GET', url: '/probe/ip', headers: FORWARDED });

    expect(res.json().ip).toBe('203.0.113.7');
  });

  it('sin trustProxy ignora la cabecera, que un cliente directo podría falsificar', async () => {
    await start();

    const res = await app.inject({ method: 'GET', url: '/probe/ip', headers: FORWARDED });

    expect(res.json().ip).not.toBe('203.0.113.7');
  });
});

describe('Configuración de proxy', () => {
  const REQUIRED = { DATABASE_URL: 'postgresql://x', JWT_SECRET: 'secreto_de_pruebas_suficiente' };

  it('está desactivada por defecto', () => {
    expect(loadConfig(REQUIRED).trustProxy).toBe(false);
  });

  it('se activa solo con TRUST_PROXY=true', () => {
    expect(loadConfig({ ...REQUIRED, TRUST_PROXY: 'true' }).trustProxy).toBe(true);
    expect(loadConfig({ ...REQUIRED, TRUST_PROXY: 'false' }).trustProxy).toBe(false);
  });

  it('rechaza valores ambiguos', () => {
    expect(() => loadConfig({ ...REQUIRED, TRUST_PROXY: 'yes' })).toThrow('TRUST_PROXY');
  });
});
