import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // PENTING: Ganti '/nama-repo-anda/' dengan nama repository GitHub Anda yang sebenarnya.
    // Contoh: jika URL github pages Anda donpablo669.github.io/toko-online/, tuliskan '/toko-online/'
    // Jika repository Anda berjenis username.github.io (root), Anda bisa menghapus baris 'base' ini.
    base: '/nama-repo-anda/',

    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
