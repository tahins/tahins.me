import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { COVER_BEFORE_TITLE } from '../src/lib/article-layout.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8');
const cover = await readFile(path.join(root, 'src/components/ArticleCover.astro'), 'utf8');

test('cover is full-bleed with the designer CSS and 100vw srcset', () => {
  assert.equal(COVER_BEFORE_TITLE, false);
  assert.match(css, /\.post-cover \{[\s\S]*width:\s*100vw/);
  assert.match(css, /\.post-cover \{[\s\S]*margin-left:\s*calc\(50% - 50vw\)/);
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(
    css,
    /\.post-cover img,[\s\S]*display:\s*block;[\s\S]*width:\s*100%;[\s\S]*height:\s*auto;[\s\S]*max-height:\s*70vh;[\s\S]*object-fit:\s*cover/,
  );
  assert.match(cover, /sizes="100vw"/);
  assert.match(cover, /\[800, 1600, 2400\]/);
  assert.match(cover, /loading="eager"/);
  assert.match(cover, /fetchpriority="high"/);
});

test('built Unsplash covers use 800/1600/2400 and keep credit in the column', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const html = await readFile(
    path.join(dist, 'blog/tin-ti-jama-surah-yusuf/index.html'),
    'utf8',
  );
  const coverBlock = html.match(/<div class="article-cover">[\s\S]*?<\/div>\s*(?:<p class="unsplash-credit">[\s\S]*?<\/p>)?/);
  assert.ok(coverBlock, 'missing article-cover');
  assert.match(html, /class="post-cover"/);
  assert.match(html, /w=800&fm=webp/);
  assert.match(html, /w=1600&fm=webp/);
  assert.match(html, /w=2400&fm=webp/);
  assert.match(html, /sizes="100vw"/);
  assert.match(html, /fetchpriority="high"/);
  const creditAt = html.indexOf('unsplash-credit');
  const postCoverAt = html.indexOf('post-cover');
  const creditClose = html.indexOf('</div>', postCoverAt);
  assert.ok(creditAt > creditClose, 'credit must sit outside .post-cover');
  assert.match(html, /photo-1548768041-2fceab4c0b85/);
  assert.doesNotMatch(html, /photo-1542219550-2da790bf52e9/);
  const postCover = html.match(/<div class="post-cover">[\s\S]*?<\/div>/);
  assert.ok(postCover);
  assert.doesNotMatch(postCover[0], /unsplash-credit/);
  assert.match(html, /class="unsplash-credit"/);
});
