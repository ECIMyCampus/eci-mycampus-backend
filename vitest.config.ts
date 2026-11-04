import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Infraestructura cubierta por pruebas de integración y archivos que solo declaran tipos.
      exclude: [
        'src/server.ts',
        'src/container.ts',
        'src/shared/database/**',
        'src/shared/utils/logger.ts',
        'src/modules/*/repositories/prisma/**',
        'src/modules/campus/repositories/campus.repository.ts',
        'src/modules/campus/services/campus.service.ts',
      ],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
