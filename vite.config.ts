import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: "/",
  preview: {
    port: 8080,
    strictPort: true,
   },
  //  server: {
  //   port: 3000,
  //   strictPort: true,
  //   host: true,
  //   origin: "http://0.0.0.0:3000",
  //  },
});
