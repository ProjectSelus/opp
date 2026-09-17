import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@opp/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
