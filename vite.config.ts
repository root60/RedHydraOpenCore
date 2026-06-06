import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'RedHydraOpenCore';
const isUserOrOrgPage = repositoryName.toLowerCase().endsWith('.github.io');

/**
 * GitHub Pages project URL:
 * https://root60.github.io/RedHydraOpenCore/
 *
 * For project pages, Vite assets must be built under /RedHydraOpenCore/.
 * For username.github.io repos, the base must stay /.
 * VITE_BASE can override this if you deploy elsewhere.
 */
const productionBase =
  process.env.VITE_BASE || (isUserOrOrgPage ? '/' : `/${repositoryName}/`);

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? productionBase : '/',
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
