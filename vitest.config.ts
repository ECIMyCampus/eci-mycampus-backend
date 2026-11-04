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
        'src/modules/auth/lib/**',
        'src/modules/auth/models/domain/types.ts',
        'src/modules/auth/repositories/user.repository.ts',
        'src/modules/auth/services/auth.service.ts',
        'src/modules/auth/validators/auth.validator.ts',
        'src/modules/events/adapters/impl/resend-email.adapter.ts',
        'src/modules/events/adapters/email.adapter.ts',
        'src/modules/events/models/domain/types.ts',
        'src/modules/events/models/domain/events/**',
        'src/modules/events/repositories/event.repository.ts',
        'src/modules/events/services/events.service.ts',
        'src/modules/events/services/notification/notification.strategy.ts',
        'src/modules/events/validators/event.validator.ts',
        'src/modules/campus/repositories/campus.repository.ts',
        'src/modules/campus/services/campus.service.ts',
      ],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
