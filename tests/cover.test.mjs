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
  assert.match(cover, /COVER_WIDTHS/);
  assert.match(cover, /fallbackFormat="webp"/);
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
  assert.match(
    html,
    /Photo by <a href="https:\/\/unsplash\.com\/@mnzoutfits"[^>]*>Mnz<\/a> on <a href="https:\/\/unsplash\.com\/photos\/sgx6AIOB7Ak"/,
  );
  assert.match(
    html,
    /property="og:image" content="https:\/\/images\.unsplash\.com\/photo-1548768041-2fceab4c0b85\?w=1200&fm=webp&q=75"/,
  );
  assert.match(html, /name="twitter:image" content="https:\/\/images\.unsplash\.com\/photo-1548768041-2fceab4c0b85\?w=1200&fm=webp&q=75"/);
  assert.match(html, /og:image:alt" content="কালো পৃষ্ঠে কালো, ধূসর ও বাদামি তিনটি ভি-নেক জামা"/);
  assert.doesNotMatch(html, /<div class="prose">[\s\S]*<img[\s\S]*photo-1548768041/);
  const index = await readFile(path.join(dist, 'blog/index.html'), 'utf8');
  assert.match(
    index,
    /href="\/blog\/tin-ti-jama-surah-yusuf\/"[\s\S]*?photo-1548768041-2fceab4c0b85\?w=240&fm=webp&q=75/,
  );
});

test('local covers are WebP-only, never upscaled past the source width', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const nyay = await readFile(path.join(dist, 'blog/nyay-o-ihsan/index.html'), 'utf8');
  const cover = nyay.match(/<div class="post-cover">[\s\S]*?<\/div>/)[0];
  assert.match(cover, /type="image\/webp"/);
  assert.doesNotMatch(cover, /\.(png|jpe?g)/i);
  assert.match(cover, /800w/);
  assert.match(cover, /1400w/);
  assert.doesNotMatch(cover, /1600w|2400w/);
  assert.match(nyay, /property="og:image" content="https:\/\/tahins\.me\/_astro\/[^"]+\.webp"/);

  const tdd = await readFile(
    path.join(dist, 'blog/the-mindset-behind-test-driven-development-tdd/index.html'),
    'utf8',
  );
  const tddCover = tdd.match(/<div class="post-cover">[\s\S]*?<\/div>/)[0];
  assert.doesNotMatch(tddCover, /\.(png|jpe?g)/i);
  assert.match(tddCover, /800w/);
  assert.doesNotMatch(tddCover, /1600w|2400w/);
});

test('tin-ti-jama frontmatter uses the sgx6AIOB7Ak Unsplash cover, not a body duplicate', async () => {
  const md = await readFile(
    path.join(root, 'src/content/blog/tin-ti-jama-surah-yusuf.md'),
    'utf8',
  );
  const closed = md.indexOf('\n---\n', 4);
  const front = md.slice(0, closed);
  const body = md.slice(closed);
  assert.match(front, /heroImage: https:\/\/images\.unsplash\.com\/photo-1548768041-2fceab4c0b85\?w=1200&fm=webp&q=75/);
  assert.match(front, /heroImageAlt: কালো পৃষ্ঠে কালো, ধূসর ও বাদামি তিনটি ভি-নেক জামা/);
  assert.match(front, /photographer: Mnz/);
  assert.match(front, /photographerUrl: https:\/\/unsplash\.com\/@mnzoutfits/);
  assert.match(front, /unsplashUrl: https:\/\/unsplash\.com\/photos\/sgx6AIOB7Ak/);
  assert.doesNotMatch(body, /<img\b/);
  assert.doesNotMatch(md, /photo-1542219550-2da790bf52e9/);
  assert.doesNotMatch(md, /AIE1_Kp5Zp4/);
});
