import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/env';

describe('loadConfig (fail-fast de variables de entorno)', () => {
  it('aplica valores por defecto en desarrollo', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x' });

    expect(config.port).toBe(4000);
    expect(config.corsOrigin).toBe(true);
    expect(config.emailFrom).toContain('ECI-MyCampus');
  });

  it('exige DATABASE_URL', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL');
  });

  it('exige JWT_SECRET en producción', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'production' })).toThrow('JWT_SECRET');
  });

  it('separa múltiples orígenes CORS', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x', CORS_ORIGIN: 'http://a.com, http://b.com' });

    expect(config.corsOrigin).toEqual(['http://a.com', 'http://b.com']);
  });

  it('trata RESEND_API_KEY vacía como ausente', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x', RESEND_API_KEY: '' });

    expect(config.resendApiKey).toBeUndefined();
  });
});
