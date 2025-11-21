import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve('.env') })
dotenv.config({ path: path.resolve('api/.env') })

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    reporters: ['verbose', 'json'],
    outputFile: {
      json: 'test-results.json',
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      exclude: ['tests/**', 'node_modules/**', 'src/test/**', '**/*.d.ts', '**/*.config.*'],
    },
    hookTimeout: 30000,
    testTimeout: 60000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})