import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  server: {
    allowedHosts: true, // Permite acesso de qualquer host (necessário para o proxy do Manus)
    // Configuração de Proxy para Contornar CORS (Senado e Câmara)
    proxy: {
      '/api/senado': {
        target: 'https://legis.senado.leg.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/senado/, '/dadosabertos'),
        secure: true,
      },
      '/api/camara-portal': {
        target: 'https://www.camara.leg.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/camara-portal/, ''),
        secure: true,
      },
      '/api/camara': {
        target: 'https://dadosabertos.camara.leg.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/camara/, ''),
        secure: true,
      }
    }
  }
})
