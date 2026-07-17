import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return ({
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
      },
      '/api/portal-transparencia': {
        target: 'https://api.portaldatransparencia.gov.br',
        changeOrigin: true,
        rewrite: (requestPath) => {
          const [pathname, query = ''] = requestPath.split('?')
          const params = new URLSearchParams(query)
          if (params.has('name')) {
            params.set('nomeAutor', params.get('name'))
            params.delete('name')
          }
          if (params.has('year')) {
            params.set('ano', params.get('year'))
            params.delete('year')
          }
          const rewrittenPath = pathname.replace(/^\/api\/portal-transparencia/, '/api-de-dados')
          return params.size ? `${rewrittenPath}?${params}` : rewrittenPath
        },
        secure: true,
        headers: env.PORTAL_TRANSPARENCIA_API_KEY
          ? { 'chave-api-dados': env.PORTAL_TRANSPARENCIA_API_KEY }
          : {},
      },
    }
  }
  })
})
