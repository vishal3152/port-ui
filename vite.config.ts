import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    sourcemap: true,
    minify: false, // Disable minification for easier debugging
  },
  server: {
    watch: {
      usePolling: true, // Ensure file watching in non-standard environments
    },
    hmr: {
      overlay: true, // Enable error overlays
    },
    fs: {
      strict: true,
      deny: ['**/.*'], // Prevent access to hidden files
    },
  },
});
