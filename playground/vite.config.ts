import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@smartv/pivot-table': resolve(root, '../packages/pivot-table/src/index.ts'),
      '@smartv/pivot-core': resolve(root, '../packages/core/src/index.ts'),
      '@smartv/pivot-vue': resolve(root, '../packages/vue/src/index.ts'),
      '@smartv/pivot-chart': resolve(root, '../packages/chart/src/index.ts'),
      '@smartv/pivot-univer': resolve(root, '../packages/univer/src/index.ts'),
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
