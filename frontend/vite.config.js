const { defineConfig } = require('vite');
const reactPlugin = require('@vitejs/plugin-react');
const { VitePWA } = require('vite-plugin-pwa');
const react = reactPlugin.default || reactPlugin;

module.exports = defineConfig({
  plugins: [
    react({
      include: ['**/*.{js,jsx,ts,tsx}'],
      babel: {
        parserOpts: {
          plugins: ['jsx'],
        },
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'Espaço Vida',
        short_name: 'Espaço Vida',
        description: 'Sistema de agendamentos, cartões e acompanhamento da clínica Espaço Vida.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f4f7fb',
        theme_color: '#ae0407',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  esbuild: {
    jsx: 'automatic',
    loader: {
      '.js': 'jsx',
    },
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      development: false,
    },
    jsxRefreshInclude: ['**/*.{js,jsx,ts,tsx}'],
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1', '0.0.0.0'],
  },
});
