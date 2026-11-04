import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4002),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  CORS_ORIGIN: z.string().optional(),
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  corsOrigin: string[] | boolean;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`[config] Variables de entorno inválidas -> ${issues}`);
  }
  const env = parsed.data;
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    corsOrigin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((o) => o.trim()) : true,
  };
}

