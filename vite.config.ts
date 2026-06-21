import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Super Admin console — runs on its own port so it can coexist with the
// tenant admin app during local development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
