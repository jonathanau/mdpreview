import { defineConfig } from 'vite';
import { seoPlugin } from './scripts/seo-pages.js';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  plugins: [seoPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
  },
});
