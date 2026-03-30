// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import jsxDevFix from './vite-plugin-jsx-fix.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsxDevFix()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: process.env.NODE_ENV !== 'production',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    target: 'esnext',
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, 'to', proxyReq.getHeader('host'));
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        },
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
})