import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  // loadEnv reads .env files for the active mode; shell variables win over them.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    base: env.VITE_BASE_PATH || '/',
    define: {
      __DEMO_MODE__: JSON.stringify(env.VITE_DEMO_MODE === 'true'),
    },
    plugins: [
      vue({
        template: {
          transformAssetUrls: {
            base: null,
            includeAbsolute: false,
          },
        },
      }),
      vuetify({ autoImport: true }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
          },
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        },
      },
    },
  };
});
