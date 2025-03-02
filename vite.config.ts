import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  base: '',
  preview: {
    port: 3000,
    host: true,
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'framer-motion']
        }
      }
    }
  }
});