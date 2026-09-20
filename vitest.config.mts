import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'desktop/**/*.test.ts', 'shared/**/*.test.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
});
