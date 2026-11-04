import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Infraestructura que requiere BD/SDK real (se cubre con pruebas de integración)
      // y archivos que solo declaran tipos/interfaces (no generan código ejecutable).
      exclude: [
        'src/server.ts',
        'src/container.ts',
        'src/lib/**',
        'src/repositories/prisma/**',
        'src/adapters/impl/resend-email.adapter.ts',
        'src/models/domain/types.ts',
        'src/models/domain/events/**',
        'src/repositories/event.repository.ts',
        'src/services/events.service.ts',
        'src/validators/event.validator.ts',
        'src/services/notification/notification.strategy.ts',
        'src/adapters/email.adapter.ts',
        'src/utils/logger.ts',
      ],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
