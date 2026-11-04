import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',
        'src/container.ts',
        'src/lib/**',
        'src/repositories/prisma/**',
        'src/models/domain/types.ts',
        'src/repositories/user.repository.ts',
        'src/services/auth.service.ts',
        'src/validators/auth.validator.ts',
      ],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});

