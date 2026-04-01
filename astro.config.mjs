// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

import robotsTxt from 'astro-robots-txt';

import { imageService } from '@unpic/astro/service';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.venusconstructiongroup.ca',

  image: {
    domains: ['assets.venusconstructiongroup.ca'],
    layout: 'constrained',
    service: imageService({
      layout: 'constrained',
    }),
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['lottie-web']
    },
    optimizeDeps: {
      include: ['lottie-web']
    }
  },

  adapter: cloudflare({
    imageService: 'compile',
  }),
  
  integrations: [
    react(),
    sitemap(),
    robotsTxt({
      sitemap: true,
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/analytics'],
        },
      ],
    }),
  ],
});