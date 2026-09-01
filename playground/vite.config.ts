import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@smart/pivot-table': resolve(root, '../packages/pivot-table/src/index.ts'),
      '@smart/pivot-core': resolve(root, '../packages/core/src/index.ts'),
      '@smart/pivot-vue': resolve(root, '../packages/vue/src/index.ts'),
      '@smart/pivot-chart': resolve(root, '../packages/chart/src/index.ts'),
      '@smart/pivot-univer': resolve(root, '../packages/univer/src/index.ts'),
    },
    dedupe: ['vue'],
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    fs: {
      allow: [resolve(root, '..')],
    },
  },
})
