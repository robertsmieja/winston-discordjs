import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 70,
        functions: 50,
        branches: 70,
        statements: 70,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/tests/**/*.ts', 'src/**/*.test.ts'],
    },
  },
})
