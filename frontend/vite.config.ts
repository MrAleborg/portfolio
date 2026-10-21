/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Like Caddy and nginx in production: the API and the crawler files are on
    // the site's own domain. The Host header is kept, so the dev box is not
    // the Canonical domain and robots.txt forbids indexing it.
    proxy: {
      '/api': 'http://localhost:8000',
      '/robots.txt': 'http://localhost:8000',
      '/sitemap.xml': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
      thresholds: { statements: 99, branches: 94, functions: 100, lines: 99 },
    },
  },
})
