import { defineConfig } from 'astro/config';
import react    from '@astrojs/react';
import sitemap  from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://davincistudio.ae',

  server: {
    host: true,
    allowedHosts: 'all',
  },

  vite: {
    server: {
      allowedHosts: 'all',
    },
    plugins: [tailwindcss()],
  },

  integrations: [
    react(),
    sitemap({
      // Exclude dev/draft pages from the public sitemap
      filter: (page) =>
        !page.includes('/hero-demo') &&
        !page.includes('/index-new') &&
        !page.includes('/old%20index-new'),
    }),
  ],
});
