import { z } from 'zod';

/** Valor público de .env.example: válido para desarrollo local, nunca en producción. */
const EXAMPLE_JWT_SECRET = 'dev_jwt_secret_key_for_eci_mycampus_local_only';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
    JWT_SECRET: z.string({ error: 'JWT_SECRET es obligatorio' }).min(16),
    CORS_ORIGIN: z.string().optional(),
    TRUST_PROXY: z.enum(['true', 'false']).default('false'),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('ECI-MyCampus <no-reply@ecimycampus.dev>'),
  })
  .superRefine((env, ctx) => {
    const isLocal = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
    if (!isLocal && env.JWT_SECRET === EXAMPLE_JWT_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET no puede ser el valor de ejemplo salvo con NODE_ENV=development o test',
      });
    }
  });

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  corsOrigin: string[] | boolean;
  /** Actívalo solo detrás de un proxy que controle X-Forwarded-For, como el ingress de Azure. */
  trustProxy?: boolean;
  resendApiKey?: string;
  emailFrom: string;
}

/** Único lector de process.env: valida al arrancar (fail-fast) y devuelve configuración tipada. */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`[config] Variables de entorno inválidas -> ${issues}`);
  }
  const env = parsed.data;
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    corsOrigin: resolveCorsOrigin(env.CORS_ORIGIN, env.NODE_ENV),
    trustProxy: env.TRUST_PROXY === 'true',
    resendApiKey: env.RESEND_API_KEY || undefined,
    emailFrom: env.EMAIL_FROM,
  };
}

/**
 * Sin CORS_ORIGIN no se habilita CORS: la web llega por rewrites del mismo origen y las apps
 * móviles nativas no están sujetas a CORS. Solo con NODE_ENV=development o test se refleja el origen.
 */
function resolveCorsOrigin(value: string | undefined, nodeEnv: string | undefined): AppConfig['corsOrigin'] {
  if (value) return value.split(',').map((origin) => origin.trim());
  return nodeEnv === 'development' || nodeEnv === 'test';
}
