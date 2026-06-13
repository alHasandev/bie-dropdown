import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'BieDropdown',
      formats: ['es'],
      fileName: () => 'bie-dropdown.js',
    },
    rollupOptions: {
      external: /^lit/,
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
