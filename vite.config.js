/* eslint-disable no-undef */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    server: {
      port: 3000,
      proxy: {
        '/functions/v1': {
          target: 'http://localhost:54321',
          changeOrigin: true,
        },
      },
    },
    define: {
      // Expose env variables to the client
      'process.env.VITE_OPENAI_API_KEY': JSON.stringify(
        env.VITE_OPENAI_API_KEY
      ),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY
      ),
      // Add global variables for ESLint
      'process.env': {},
      Deno: {},
    },
  };
});
