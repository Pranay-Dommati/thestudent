import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Use VITE_BASE_PATH when deploying under a subfolder
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    plugins: [
      react()
    ],
    base,
    build: {
      target: 'es2019',
      rollupOptions: {
        output: {
          manualChunks: {
            pdfjs: ['react-pdf', 'pdfjs-dist'],
            vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          }
        }
      }
    },
    cacheDir: 'node_modules/.vite-cache',
    server: {
      fs: { strict: false },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
