// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.venusconstructiongroup.ca',
  
  image: {
    domains: ['assets.venusconstructiongroup.ca'],
  },

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare(),
  
  integrations: [
    react(),
    sitemap(),
    robotsTxt({
      sitemap: true,
      policy: [
        {
          userAgent: '*',
          allow: '/',
        },
      ],
    }),
  ],
});