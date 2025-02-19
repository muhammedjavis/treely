import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/functions/v1': {
        target: 'http://localhost:54321',
        changeOrigin: true,
      },
    },
  },
  define: {
    // Add global variables for ESLint
    'process.env': {},
    Deno: {},
  },
});
