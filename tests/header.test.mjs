import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const layout = await readFile(path.join(root, 'src/layouts/BaseLayout.astro'), 'utf8');
const navbar = await readFile(path.join(root, 'src/components/Navbar.astro'), 'utf8');
const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8');
const home = await readFile(path.join(root, 'src/pages/index.astro'), 'utf8');
const chrome = await readFile(path.join(root, 'src/components/BlogChrome.astro'), 'utf8');
const page404 = await readFile(path.join(root, 'src/pages/404.astro'), 'utf8');

const NAV_HREFS = ['/#projects', '/blog/', '/#profile', '/#contact'];

function navHrefs(html) {
  const block = html.match(/<nav class="navbar"[\s\S]*?<\/nav>/);
  assert.ok(block, 'missing navbar');
  return [...block[0].matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]);
}

test('one shared Navbar lives in BaseLayout, not in page shells', () => {
  assert.match(layout, /<Navbar \/>/);
  assert.doesNotMatch(home, /Navbar/);
  assert.doesNotMatch(chrome, /Navbar/);
  assert.doesNotMatch(page404, /Navbar/);
  assert.match(navbar, /class="site-header"/);
  assert.match(navbar, /href="\/"/);
  assert.match(navbar, /aria-current/);
});

test('bar tokens are the home look and are not theme tokens', () => {
  assert.match(css, /--bar-bg:\s*#000/);
  assert.match(css, /--bar-fg:\s*#fff/);
  assert.match(css, /--bar-underline:\s*#fff/);
  assert.match(css, /--bar-font:\s*Consolas/);
  assert.match(css, /\.site-header \{[\s\S]*background:\s*var\(--bar-bg\)/);
  assert.match(css, /\.site-header \{[\s\S]*font-family:\s*var\(--bar-font\)/);
  assert.match(css, /\.navbar \.brand,\s*\.navbar \.nav-links a \{[\s\S]*color:\s*var\(--bar-fg\)/);
  assert.match(css, /\.navbar \.nav-links \{[\s\S]*text-transform:\s*uppercase/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /flex-wrap:\s*nowrap/);
  assert.doesNotMatch(css, /\.blog-theme \{[^}]*--bar-bg/);
  assert.doesNotMatch(css, /\.blog-theme \{[^}]*--bar-fg/);
});

test('built pages share nav hrefs; Blog is current on articles', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const homeHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
  const articleHtml = await readFile(
    path.join(dist, 'blog/tin-ti-jama-surah-yusuf/index.html'),
    'utf8',
  );
  const blogHtml = await readFile(path.join(dist, 'blog/index.html'), 'utf8');
  const notFound = await readFile(path.join(dist, '404.html'), 'utf8');
  const tagHtml = await readFile(path.join(dist, 'blog/tags/tdd/index.html'), 'utf8');

  for (const html of [homeHtml, articleHtml, blogHtml, notFound, tagHtml]) {
    const hrefs = navHrefs(html);
    assert.equal(hrefs[0], '/');
    assert.deepEqual(hrefs.slice(1), NAV_HREFS);
  }
  assert.doesNotMatch(homeHtml, /href="\/blog\/"[^>]*aria-current="page"/);
  assert.match(articleHtml, /href="\/blog\/"[^>]*aria-current="page"/);
  assert.match(blogHtml, /href="\/blog\/"[^>]*aria-current="page"/);
  assert.match(tagHtml, /href="\/blog\/"[^>]*aria-current="page"/);
});
