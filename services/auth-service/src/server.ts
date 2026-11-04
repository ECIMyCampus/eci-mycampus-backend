import 'dotenv/config';
import { buildApp } from './app';
import { loadConfig } from './config/env';
import { buildContainer } from './container';

async function start(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config, () => buildContainer(config));

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Cerrando auth-service...');
    await app.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void start();
