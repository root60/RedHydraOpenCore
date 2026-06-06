import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * GitHub Pages project URL:
 * https://root60.github.io/RedHydraOpenCore/
 *
 * Project pages must build Vite assets under /RedHydraOpenCore/.
 */
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/RedHydraOpenCore/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
