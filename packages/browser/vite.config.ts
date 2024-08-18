import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { visualizer } from 'rollup-plugin-visualizer';
import { multipleEntryFilePlugin } from 'vite-plugin-multiple-entries';
import UnpluginInjectPreload from 'unplugin-inject-preload/vite';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    vueJsx({
      optimize: true,
      resolveType: true,
      enableObjectSlots: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: command === 'serve',
      },
      manifest: {
        name: 'Essai',
        short_name: 'Essai',
        description: '线下实验招募平台',
        theme_color: '#ffffff',
        icons: [],
      },
    }),
    visualizer({
      open: true,
      filename: 'dist/visualizer.html',
    }),
    multipleEntryFilePlugin({
      chunkName: 'load',
      entryPath: command === 'serve' ? '/src/load.ts' : resolve('src/load.ts'),
    }),
    UnpluginInjectPreload({
      files: [
        {
          outputMatch: /.css$/,
          attributes: {
            type: void 0,
          },
        },
        {
          outputMatch: /.(eot|ttf|woff|woff2)$/,
          attributes: {
            type: void 0,
            as: 'font',
          },
        },
        {
          outputMatch: /.js$/,
          attributes: {
            type: void 0,
            rel: 'modulepreload',
          },
        },
      ],
    }),
    // viteCompression(),
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: command === 'serve',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: command === 'serve',
  },
  build: {
    target: 'esnext',
    reportCompressedSize: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(path) {
          // css
          if (path.endsWith('.css')) {
            const name =
              path.match(/node_modules\/([^]+?)\/[^]+.css$/)?.[1] ?? 'index';
            return `css/${name}`;
          }
          // all
          for (const [folder, regexp] of Object.entries({
            lib: /node_modules\/([^]+?)\//,
            page: /src\/pages\/([^]+?)\/index.(ts|tsx|vue)/,
          })) {
            const name = path.match(regexp)?.[1];
            if (name) {
              return folder === '' ? name : `${folder}/${name}`;
            }
          }
        },
      },
    },
  },
  server: {},
}));
