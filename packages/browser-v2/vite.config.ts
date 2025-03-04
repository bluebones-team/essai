import tailwindcss from '@tailwindcss/vite';
import data from 'shared/router/config.json' with { type: 'json' };
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import babelPlugin from 'vite-plugin-babel';

export default defineConfig({
  plugins: [
    tailwindcss(),
    babelPlugin({
      filter: /\.[tj]sx?$/,
      babelConfig: {
        presets: [['@babel/preset-typescript']],
        plugins: [['jsx-dom-expressions', { moduleName: 'vuerx-jsx' }]],
      },
    }),
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': `http://localhost:${data.devPort}`,
    },
  },
});
