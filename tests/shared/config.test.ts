import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/env';

const REQUIRED = { DATABASE_URL: 'postgresql://x', JWT_SECRET: 'secreto_de_pruebas_suficiente' };

describe('loadConfig (fail-fast de variables de entorno)', () => {
  it('aplica valores por defecto en desarrollo', () => {
    const config = loadConfig({ ...REQUIRED, NODE_ENV: 'development' });

    expect(config.port).toBe(4000);
    expect(config.corsOrigin).toBe(true);
    expect(config.emailFrom).toContain('ECI-MyCampus');
  });

  it('exige DATABASE_URL', () => {
    expect(() => loadConfig({ JWT_SECRET: REQUIRED.JWT_SECRET })).toThrow('DATABASE_URL');
  });

  it.each(['development', 'production', 'test'])('exige JWT_SECRET en %s: no hay secreto por defecto', (NODE_ENV) => {
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV })).toThrow('JWT_SECRET');
  });

  it('rechaza un JWT_SECRET demasiado corto', () => {
    expect(() => loadConfig({ ...REQUIRED, JWT_SECRET: 'corto' })).toThrow('JWT_SECRET');
  });

  it('rechaza en producción el secreto de ejemplo, que es público', () => {
    const JWT_SECRET = 'dev_jwt_secret_key_for_eci_mycampus_local_only';

    expect(() => loadConfig({ ...REQUIRED, JWT_SECRET, NODE_ENV: 'production' })).toThrow('valor de ejemplo');
    expect(loadConfig({ ...REQUIRED, JWT_SECRET, NODE_ENV: 'development' }).jwtSecret).toBe(JWT_SECRET);
  });

  it('sin NODE_ENV explícito no acepta el secreto de ejemplo ni habilita CORS', () => {
    const JWT_SECRET = 'dev_jwt_secret_key_for_eci_mycampus_local_only';

    expect(() => loadConfig({ ...REQUIRED, JWT_SECRET })).toThrow('valor de ejemplo');
    expect(loadConfig(REQUIRED).corsOrigin).toBe(false);
  });

  it('separa múltiples orígenes CORS', () => {
    const config = loadConfig({ ...REQUIRED, CORS_ORIGIN: 'http://a.com, http://b.com' });

    expect(config.corsOrigin).toEqual(['http://a.com', 'http://b.com']);
  });

  it('en producción no habilita CORS si no se configura', () => {
    expect(loadConfig({ ...REQUIRED, NODE_ENV: 'production' }).corsOrigin).toBe(false);
  });

  it('trata RESEND_API_KEY vacía como ausente', () => {
    expect(loadConfig({ ...REQUIRED, RESEND_API_KEY: '' }).resendApiKey).toBeUndefined();
  });
});
