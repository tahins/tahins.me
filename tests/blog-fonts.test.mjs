import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = path.join(root, 'public/fonts');

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

function fontFaceBlocks(css) {
  return [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map((match) => match[0]);
}

function urlsIn(block) {
  return [...block.matchAll(/url\((['"]?)([^'")]+)\1\)/g)].map((match) => match[2]);
}

const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8');
const pkg = await readFile(path.join(root, 'package.json'), 'utf8');
const slugPage = await readFile(path.join(root, 'src/pages/blog/[...slug].astro'), 'utf8');
const layout = await readFile(path.join(root, 'src/layouts/BaseLayout.astro'), 'utf8');
const indexPage = await readFile(path.join(root, 'src/pages/blog/index.astro'), 'utf8');
const blogLib = await readFile(path.join(root, 'src/lib/blog.js'), 'utf8');

test('fonttools is not a package.json dependency', () => {
  const parsed = JSON.parse(pkg);
  const deps = { ...parsed.dependencies, ...parsed.devDependencies };
  assert.equal(deps.fonttools, undefined);
  assert.equal(deps.pyftsubset, undefined);
  assert.doesNotMatch(pkg, /fonttools|pyftsubset/);
});

test('OFL licenses sit next to the self-hosted WOFF2 files', async () => {
  const files = [
    'literata-latin-400.woff2',
    'literata-latin-400-italic.woff2',
    'literata-latin-700.woff2',
    'noto-serif-bengali-400.woff2',
    'noto-serif-bengali-700.woff2',
    'OFL-Literata.txt',
    'OFL-NotoSerifBengali.txt',
  ];
  for (const name of files) {
    assert.equal(await exists(path.join(fontsDir, name)), true, name);
  }
  const literataOfl = await readFile(path.join(fontsDir, 'OFL-Literata.txt'), 'utf8');
  const notoOfl = await readFile(path.join(fontsDir, 'OFL-NotoSerifBengali.txt'), 'utf8');
  assert.match(literataOfl, /SIL Open Font License/i);
  assert.match(literataOfl, /Literata/);
  assert.match(notoOfl, /SIL Open Font License/i);
  assert.match(notoOfl, /Noto Project Authors/i);
  assert.match(notoOfl, /notofonts\/bengali/);
});

test('blog titles and body use the Literata / Noto Serif Bengali stack', () => {
  assert.match(
    css,
    /--blog-serif:\s*'Literata',\s*'Noto Serif Bengali',\s*Charter,\s*Georgia,\s*serif/,
  );
  assert.match(css, /\.blog-page-title,\s*\.article-title \{[\s\S]*font-family: var\(--blog-serif\)/);
  assert.match(css, /\.post-title \{[\s\S]*font-family: var\(--blog-serif\)/);
  assert.match(css, /\.blog-post \.prose \{[\s\S]*font-family: var\(--blog-serif\)/);
  assert.match(css, /--blog-chrome:\s*system-ui/);
  assert.match(css, /\.blog-sidebar[\s\S]*font-family: var\(--blog-chrome\)/);
});

test('Hind Siliguri Google Fonts import is unchanged', () => {
  assert.match(
    css,
    /^@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Hind\+Siliguri&display=swap'\);/m,
  );
});

test('@font-face files are local, swap, and Bengali faces set unicode-range', () => {
  const faces = fontFaceBlocks(css);
  assert.equal(faces.length, 5);
  for (const face of faces) {
    assert.match(face, /font-display:\s*swap/);
    const urls = urlsIn(face);
    assert.ok(urls.length > 0, face);
    for (const url of urls) {
      assert.match(url, /^\/fonts\/[\w.-]+\.woff2$/);
      assert.doesNotMatch(url, /^https?:/i);
    }
  }
  const bengali = faces.filter((face) => /Noto Serif Bengali/.test(face));
  assert.equal(bengali.length, 2);
  for (const face of bengali) {
    assert.match(face, /unicode-range:\s*U\+0980-09FF,\s*U\+0964-0965,\s*U\+200C-200D,\s*U\+25CC/);
  }
});

test('no @font-face or font preload URL points off-site', () => {
  for (const face of fontFaceBlocks(css)) {
    for (const url of urlsIn(face)) {
      assert.doesNotMatch(url, /^https?:\/\//i);
      assert.doesNotMatch(url, /fonts\.googleapis|fonts\.gstatic|cdn\./i);
    }
  }
  const preloads = [...layout.matchAll(/rel="preload"[^>]*>/g)].map((match) => match[0]);
  for (const tag of preloads) {
    if (!/\bas="font"/.test(tag) && !/as="font"/.test(tag) && !/type="font\/woff2"/.test(tag)) {
      continue;
    }
    assert.doesNotMatch(tag, /https?:\/\//);
  }
  assert.match(slugPage, /preloadFont="\/fonts\/literata-latin-400\.woff2"/);
  assert.doesNotMatch(indexPage, /preloadFont/);
  assert.doesNotMatch(slugPage, /preloadFont=.*noto/i);
});

test('Bangla posts get lang=bn; English posts get lang=en', () => {
  assert.match(blogLib, /export function postLang/);
  assert.match(blogLib, /\\u0980-\\u09FF/);
  assert.match(blogLib, /\? 'bn' : 'en'/);
  assert.match(slugPage, /postLang/);
  assert.match(slugPage, /lang=\{lang\}/);
  assert.match(css, /\.blog-post:lang\(bn\) \.prose \{[\s\S]*line-height:\s*1\.8/);
  assert.match(css, /\.blog-post:lang\(bn\) \.prose \{[\s\S]*font-size:\s*19px/);
});

test('built articles preload Literata Regular locally and set lang', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const english = await readFile(
    path.join(dist, 'blog/the-mindset-behind-test-driven-development-tdd/index.html'),
    'utf8',
  );
  const bangla = await readFile(path.join(dist, 'blog/nyay-o-ihsan/index.html'), 'utf8');
  const list = await readFile(path.join(dist, 'blog/index.html'), 'utf8');

  assert.match(
    english,
    /<link rel="preload" href="\/fonts\/literata-latin-400\.woff2" as="font" type="font\/woff2" crossorigin/,
  );
  assert.match(bangla, /href="\/fonts\/literata-latin-400\.woff2"/);
  assert.doesNotMatch(english, /preload[^>]+noto-serif-bengali/i);
  assert.doesNotMatch(list, /rel="preload"[^>]+as="font"/);

  assert.match(english, /<article class="blog-post[^"]*" lang="en">/);
  assert.match(bangla, /<article class="blog-post[^"]*" lang="bn">/);

  const distCssFiles = (await walk(path.join(dist, '_astro'))).filter((file) =>
    file.endsWith('.css'),
  );
  let faces = [];
  for (const file of distCssFiles) {
    faces = faces.concat(fontFaceBlocks(await readFile(file, 'utf8')));
  }
  assert.ok(faces.length >= 5, `expected @font-face in dist CSS, got ${faces.length}`);
  for (const face of faces) {
    for (const url of urlsIn(face)) {
      assert.doesNotMatch(url, /^https?:\/\//i, url);
      assert.doesNotMatch(url, /fonts\.googleapis|fonts\.gstatic/i, url);
    }
  }

  assert.equal(await exists(path.join(dist, 'fonts/literata-latin-400.woff2')), true);
  assert.equal(await exists(path.join(dist, 'fonts/noto-serif-bengali-400.woff2')), true);
});
