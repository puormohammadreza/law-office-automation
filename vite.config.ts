import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icon-192.png', 'icon.png'],
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html'
        },
        manifest: {
          id: '/?pwa-v11',
          name: 'اتوماسیون دفتر وکالت',
          short_name: 'اتوماسیون دفتر وکالت',
          description: 'سامانه هوشمند مدیریت پرونده‌ها، یادداشت‌ها و تقویم دادرسی رضا پورمحمد',
          start_url: '/?pwa=true&v=11',
          scope: '/',
          display: 'standalone',
          background_color: '#0f172a',
          theme_color: '#1e293b',
          orientation: 'portrait',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5000000
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
