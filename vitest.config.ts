import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// Nuxt aliases are not registered for `node`-environment projects
// (server-unit / e2e), but server code imports via `~~/` and `~`.
// Array+regex form is required: object-form keys only match exactly.
const nuxtAliases = [
  { find: /^~~\//, replacement: rootDir },
  { find: /^@@\//, replacement: rootDir },
  { find: /^~\//, replacement: rootDir },
  { find: /^@\//, replacement: rootDir },
]

export default defineConfig({
  test: {
    globals: true,
    // The shared setup wipes & reseeds collections on every suite start;
    // parallel workers race each other and collide on unique indexes
    // (E11000 on NIM/username), so files must run sequentially.
    fileParallelism: false,
    projects: [
      {
        resolve: { alias: nuxtAliases },
        test: {
          name: 'server-unit',
          include: ['tests/server/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['./tests/e2e/setup.ts'],
        },
      },
      {
        resolve: { alias: nuxtAliases },
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['./tests/e2e/setup.ts'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.test.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
