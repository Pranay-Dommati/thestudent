import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Use VITE_BASE_PATH when deploying under a subfolder (e.g., /app/)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  
  return {
  plugins: [react()],
  base,
  cacheDir: 'node_modules/.vite-cache',
  build: {
    minify: 'terser',
    // Only strip console logs and debug tools in production builds
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        global_defs: {
          DEBUG: false,
          "process.env.NODE_ENV": JSON.stringify("production")
        }
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'react/jsx-runtime'],
          vendor: ['@heroicons/react', 'framer-motion', 'posthog-js'],
          katex: ['katex'],
          pdf: ['pdfjs-dist']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    fs: { strict: false },
    proxy: {
      '/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}
})
