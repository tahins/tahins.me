import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const LIMIT = 500 * 1024;
const PROJECT_STEMS = ['todox', 'getbriefly', 'hajjmate', 'quran-map', 'alaap', 'dua-deck', 'gdvs'];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function localAssetPaths(html) {
  const urls = [];
  for (const match of html.matchAll(/(?:src|srcset|content)="([^"]+)"/g)) {
    for (const token of match[1].split(',')) {
      const url = token.trim().split(/\s+/)[0];
      if (url.startsWith('/_astro/') || url.includes('/_astro/')) {
        const pathname = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
        urls.push(pathname);
      }
    }
  }
  return urls;
}

function block(html, pattern) {
  const match = html.match(pattern);
  return match ? match[0] : '';
}

test('article covers and project images in dist are WebP and stay under 500 KB', async (t) => {
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }

  const files = await walk(dist);
  const bannedProjects = files.filter((file) => {
    const base = path.basename(file).toLowerCase();
    return PROJECT_STEMS.some((name) => base.includes(name) && /\.(png|jpe?g)$/i.test(base));
  });
  assert.deepEqual(bannedProjects, [], `project PNG/JPG in dist:\n${bannedProjects.join('\n')}`);

  const referenced = new Set();
  const home = await readFile(path.join(dist, 'index.html'), 'utf8');
  for (const url of localAssetPaths(block(home, /<ul class="current-projects">[\s\S]*?<\/ul>/))) {
    referenced.add(url);
  }

  const blogIndex = await readFile(path.join(dist, 'blog/index.html'), 'utf8');
  for (const url of localAssetPaths(blogIndex)) {
    if (url.includes('image-1.') || /\/_astro\/(?!me\.)/.test(url)) {
      referenced.add(url);
    }
  }

  const blogRoot = path.join(dist, 'blog');
  const slugs = (await readdir(blogRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== 'tags')
    .map((entry) => entry.name);

  const oversized = [];
  const raster = [];

  for (const slug of slugs) {
    const html = await readFile(path.join(blogRoot, slug, 'index.html'), 'utf8');
    const cover = block(html, /<div class="post-cover">[\s\S]*?<\/div>/);
    const og = html.match(/property="og:image" content="([^"]+)"/)?.[1] || '';
    const urls = [...localAssetPaths(cover), ...localAssetPaths(`content="${og}"`)];
    for (const url of urls) referenced.add(url);
    if (cover) {
      assert.doesNotMatch(cover, /\.(png|jpe?g)(?:\s|"|,|$)/i, `${slug} cover is not WebP-only`);
      const localCover = /\/_astro\//.test(cover);
      if (localCover) {
        assert.match(cover, /\.webp/i, `${slug} cover missing WebP`);
      } else {
        assert.match(cover, /fm=webp/, `${slug} Unsplash cover missing fm=webp`);
      }
    }
    if (og.includes('/_astro/')) {
      assert.match(og, /\.webp(\?|$)/i, `${slug} og:image is not WebP`);
    }
  }

  for (const url of referenced) {
    if (!/\.(png|jpe?g|webp)$/i.test(url)) continue;
    const filePath = path.join(dist, url.replace(/^\//, ''));
    if (!(await exists(filePath))) continue;
    const size = (await stat(filePath)).size;
    if (/\.(png|jpe?g)$/i.test(url)) raster.push({ url, size });
    if (size > LIMIT) oversized.push({ url, size });
  }

  if (oversized.length) {
    console.log('Cover/project files over 500 KB:');
    for (const row of oversized) console.log(`  ${row.size}\t${row.url}`);
  }
  assert.deepEqual(raster, [], `cover/project raster leftovers: ${JSON.stringify(raster)}`);
  assert.deepEqual(
    oversized,
    [],
    `cover/project files over 500 KB: ${JSON.stringify(oversized)}`,
  );
});
