import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src/engine'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@state': resolve(__dirname, 'src/state'),
      '@data': resolve(__dirname, 'src/data'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types-game': resolve(__dirname, 'src/types'),
    },
  },
  server: {
    port: 8900,
    proxy: {
      '/api': {
        target: 'http://localhost:9800',
        changeOrigin: true,
      },
    },
  },
});
