import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Verfalarm',
        short_name: 'Verfalarm',
        theme_color: '#16a34a',
        icons: [
          {
            src: 'icons/verfalarm-icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/verfalarm-icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
