import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/generate': {
        target: process.env.VITE_SERVER_URL,
        changeOrigin: true,
      },
      '/models': {
        target: process.env.VITE_SERVER_URL,
        changeOrigin: true,
      },
    },
  },
});
