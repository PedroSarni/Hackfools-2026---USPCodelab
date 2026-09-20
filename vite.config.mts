import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        camera: resolve(import.meta.dirname, 'camera.html'),
        instagram: resolve(import.meta.dirname, 'instagram.html'),
      },
    },
  },
});
