import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const root = dirname(fileURLToPath(import.meta.url))

const externals = [
  'vue',
  'pinia',
  'echarts',
  '@univerjs/core',
  '@smart/pivot-core',
  '@smart/pivot-vue',
  '@smart/pivot-chart',
  '@smart/pivot-univer',
]

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: resolve(root, 'tsconfig.json'),
      include: ['src/**/*.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(root, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: (id) => externals.some((pkg) => id === pkg || id.startsWith(`${pkg}/`)),
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
