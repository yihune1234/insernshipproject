import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    visualizer({
      filename: 'bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/integrations': path.resolve(__dirname, './src/integrations'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@context': path.resolve(__dirname, './src/context'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react'
          if (id.includes('node_modules/@radix-ui') || id.includes('lucide-react') || id.includes('tailwind-merge') || id.includes('clsx')) return 'vendor-ui'
          if (id.includes('recharts')) return 'vendor-charts'
          if (id.includes('date-fns') || id.includes('zod') || id.includes('axios') || id.includes('zustand') || id.includes('@tanstack')) return 'vendor-utils'
          if (id.includes('qrcode') || id.includes('html5-qrcode') || id.includes('jsqr')) return 'vendor-qr'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx,js,jsx}'],
    css: true,
  },
})
