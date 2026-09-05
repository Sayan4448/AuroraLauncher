import { defineConfig } from 'electron-vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    root: 'src/renderer',
    plugins: [vue({})],
    build: {
      rollupOptions: {
        input: 'src/renderer/index.html'
      }
    }
  }
});
