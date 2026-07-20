/**
 * Vitest configuration
 *
 * Uses jsdom for a browser-like DOM environment.
 * Path aliases mirror tsconfig.json so @/ imports work in tests.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals:     true,
    setupFiles:  ['./src/test/setup.ts'],
    css:         false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude:  ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*'],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
