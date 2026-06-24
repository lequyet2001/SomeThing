import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/')
          if (!normalizedId.includes('node_modules')) return undefined
          if (normalizedId.includes('/three/')) return 'three'
          if (normalizedId.includes('/lucide-react/')) return 'icons'
          if (normalizedId.includes('/react-hook-form/') || normalizedId.includes('/@hookform/') || normalizedId.includes('/zod/') || normalizedId.includes('/clsx/')) return 'forms'
          if (
            normalizedId.includes('/@reduxjs/') ||
            normalizedId.includes('/@headlessui/') ||
            normalizedId.includes('/@floating-ui/') ||
            normalizedId.includes('/@tanstack/') ||
            normalizedId.includes('/react-redux/') ||
            normalizedId.includes('/@remix-run/router/') ||
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/react-router/') ||
            normalizedId.includes('/react-router-dom/') ||
            normalizedId.includes('/scheduler/')
          ) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
