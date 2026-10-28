import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tahins.me',
  trailingSlash: 'always',
  // Keep v5/v6 HTML-aware spacing so inline layout (nav, bylines) does not
  // collapse under Astro 7's default JSX whitespace rules.
  compressHTML: true,
  integrations: [mdx(), sitemap()],
  // CTO-approved. Hosted images only; Unsplash stays a hotlink.
  // Local WebP is q82 / effort 6 and never upscaled (see src/image-service.mjs).
  image: {
    service: {
      entrypoint: './src/image-service.mjs',
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
