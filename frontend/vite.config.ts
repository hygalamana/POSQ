import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'next/navigation', replacement: path.resolve(import.meta.dirname, './src/lib/routerCompat.tsx') },
      { find: 'next/link', replacement: path.resolve(import.meta.dirname, './src/lib/routerCompat.tsx') },
      { find: '@', replacement: path.resolve(import.meta.dirname, './src') },
    ],
  },
  server: {
    port: 9990,
    proxy: {
      '/api': {
        target: 'http://localhost:9991',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  },
});
