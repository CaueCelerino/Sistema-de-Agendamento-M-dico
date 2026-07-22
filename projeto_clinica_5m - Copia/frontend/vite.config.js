const { defineConfig } = require('vite');
const reactPlugin = require('@vitejs/plugin-react');
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
    port: 4173,
  },
});
