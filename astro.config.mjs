import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

function remarkEmptyImageAlts() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'image' && node.alt == null) node.alt = '';
      for (const child of node.children || []) visit(child);
    };
    visit(tree);
  };
}

function rehypeLazyImages() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties ??= {};
        if (!node.properties.loading) node.properties.loading = 'lazy';
        if (!node.properties.decoding) node.properties.decoding = 'async';
        if (node.properties.alt == null) node.properties.alt = '';
      }
      for (const child of node.children || []) visit(child);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://tahins.me',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
    remarkPlugins: [remarkEmptyImageAlts],
    rehypePlugins: [rehypeLazyImages],
  },
});
