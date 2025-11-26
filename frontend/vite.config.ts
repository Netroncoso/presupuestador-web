import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.code === 'ECONNRESET') return;
            console.error('proxy error', err);
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
          pdf: ['jspdf', 'jspdf-autotable'],
          table: ['mantine-react-table', '@tanstack/react-table']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})