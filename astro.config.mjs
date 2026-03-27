import { defineConfig } from 'astro/config';

export default defineConfig({
  server: {
    host: true,
    allowedHosts: 'all',
  },
  vite: {
    server: {
      allowedHosts: 'all',
    },
  },
});