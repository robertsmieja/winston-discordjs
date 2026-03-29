import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 95,
        functions: 90,
        branches: 88,
        statements: 95,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/tests/**/*.ts', 'src/**/*.test.ts'],
    },
  },
})
