import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/ui/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'next/navigation': resolve(__dirname, 'src/compat/next-navigation.ts'),
      'next/link': resolve(__dirname, 'src/compat/next-link.tsx'),
      'next/dynamic': resolve(__dirname, 'src/compat/next-dynamic.tsx'),
    },
  },
  server: {
    port: 21999,
  },
})
