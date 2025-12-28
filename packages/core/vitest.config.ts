import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/.size-limit.cjs',
      ],
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 50,
        statements: 10,
      },
    },
  },
})
