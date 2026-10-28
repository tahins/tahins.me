import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = path.join(root, 'public/fonts');

const FONT_FILES = [
  'literata-latin-400-v3.103.woff2',
  'literata-latin-400-italic-v3.103.woff2',
  'literata-latin-700-v3.103.woff2',
  'noto-serif-bengali-400-v3.000.woff2',
  'noto-serif-bengali-700-v3.000.woff2',
  'hind-siliguri-400-v1.001.woff2',
  'hind-siliguri-700-v1.001.woff2',
  'OFL-Literata.txt',
  'OFL-NotoSerifBengali.txt',
  'OFL-HindSiliguri.txt',
];

const TEXT_EXT = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.xml',
  '.txt',
  '.svg',
  '.map',
  '.webmanifest',
]);

const GOOGLE_FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/i;

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

function headerBlocks(toml) {
  return toml.split(/\[\[headers\]\]/).slice(1);
}

function headerFor(toml, glob) {
  const escaped = glob.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return headerBlocks(toml).find((block) => new RegExp(`for\\s*=\\s*"${escaped}"`).test(block));
}

const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8');
const pkg = await readFile(path.join(root, 'package.json'), 'utf8');
const slugPage = await readFile(path.join(root, 'src/pages/blog/[...slug].astro'), 'utf8');
const layout = await readFile(path.join(root, 'src/layouts/BaseLayout.astro'), 'utf8');
const indexPage = await readFile(path.join(root, 'src/pages/blog/index.astro'), 'utf8');
const homePage = await readFile(path.join(root, 'src/pages/index.astro'), 'utf8');
const blogLib = await readFile(path.join(root, 'src/lib/blog.js'), 'utf8');
const netlify = await readFile(path.join(root, 'netlify.toml'), 'utf8');
const siteData = await readFile(path.join(root, 'src/data/site.js'), 'utf8');

test('fonttools is not a package.json dependency', () => {
  const parsed = JSON.parse(pkg);
  const deps = { ...parsed.dependencies, ...parsed.devDependencies };
  assert.equal(deps.fonttools, undefined);
  assert.equal(deps.pyftsubset, undefined);
  assert.doesNotMatch(pkg, /fonttools|pyftsubset/);
});

test('OFL licenses sit next to the self-hosted WOFF2 files', async () => {
  for (const name of FONT_FILES) {
    assert.equal(await exists(path.join(fontsDir, name)), true, name);
  }
  const literataOfl = await readFile(path.join(fontsDir, 'OFL-Literata.txt'), 'utf8');
  const notoOfl = await readFile(path.join(fontsDir, 'OFL-NotoSerifBengali.txt'), 'utf8');
  const hindOfl = await readFile(path.join(fontsDir, 'OFL-HindSiliguri.txt'), 'utf8');
  assert.match(literataOfl, /SIL Open Font License/i);
  assert.match(literataOfl, /Literata/);
  assert.match(notoOfl, /SIL Open Font License/i);
  assert.match(notoOfl, /Noto Project Authors/i);
  assert.match(notoOfl, /notofonts\/bengali/);
  assert.match(hindOfl, /SIL Open Font License/i);
  assert.match(hindOfl, /Indian Type Foundry/);
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

test('Hind Siliguri is self-hosted; nothing is imported from Google Fonts', () => {
  assert.doesNotMatch(css, /@import/);
  assert.doesNotMatch(css, GOOGLE_FONT_HOSTS);
  assert.match(css, /monospace, 'Hind Siliguri', serif/);
  const hind = fontFaceBlocks(css).filter((face) => /Hind Siliguri/.test(face));
  assert.equal(hind.length, 2);
  for (const face of hind) {
    assert.match(face, /font-display:\s*swap/);
    assert.match(face, /unicode-range:\s*U\+0980-09FF;/);
    assert.doesNotMatch(face, /preload/i);
  }
  assert.match(css, /url\('\/fonts\/hind-siliguri-400-v1\.001\.woff2'\)/);
  assert.match(css, /url\('\/fonts\/hind-siliguri-700-v1\.001\.woff2'\)/);
  assert.match(siteData, /কোভিড-১৯ পরিস্থিতি/);
  assert.match(siteData, /আবহাওয়া/);
  assert.doesNotMatch(homePage, /preloadFont/);
  assert.doesNotMatch(slugPage, /preloadFont=.*hind/i);
});

test('@font-face files are local, versioned, swap, and Bengali faces set unicode-range', () => {
  const faces = fontFaceBlocks(css);
  assert.equal(faces.length, 7);
  for (const face of faces) {
    assert.match(face, /font-display:\s*swap/);
    const urls = urlsIn(face);
    assert.ok(urls.length > 0, face);
    for (const url of urls) {
      assert.match(url, /^\/fonts\/[\w.-]+\.woff2$/);
      assert.match(url, /v\d/);
      assert.doesNotMatch(url, /^https?:/i);
    }
  }
  const noto = faces.filter((face) => /Noto Serif Bengali/.test(face));
  assert.equal(noto.length, 2);
  for (const face of noto) {
    assert.match(face, /unicode-range:\s*U\+0980-09FF,\s*U\+0964-0965,\s*U\+200C-200D,\s*U\+25CC/);
  }
  const hind = faces.filter((face) => /Hind Siliguri/.test(face));
  assert.equal(hind.length, 2);
  for (const face of hind) {
    assert.match(face, /unicode-range:\s*U\+0980-09FF;/);
  }
});

test('no @font-face or font preload URL points off-site', () => {
  for (const face of fontFaceBlocks(css)) {
    for (const url of urlsIn(face)) {
      assert.doesNotMatch(url, /^https?:\/\//i);
      assert.doesNotMatch(url, GOOGLE_FONT_HOSTS);
      assert.doesNotMatch(url, /cdn\./i);
    }
  }
  const preloads = [...layout.matchAll(/rel="preload"[^>]*>/g)].map((match) => match[0]);
  for (const tag of preloads) {
    if (!/\bas="font"/.test(tag) && !/as="font"/.test(tag) && !/type="font\/woff2"/.test(tag)) {
      continue;
    }
    assert.doesNotMatch(tag, /https?:\/\//);
    assert.doesNotMatch(tag, GOOGLE_FONT_HOSTS);
  }
  assert.match(slugPage, /preloadFont="\/fonts\/literata-latin-400-v3\.103\.woff2"/);
  assert.doesNotMatch(indexPage, /preloadFont/);
  assert.doesNotMatch(slugPage, /preloadFont=.*noto/i);
  assert.doesNotMatch(slugPage, /preloadFont=.*hind/i);
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

test('netlify.toml immutable-caches /fonts/* and /_astro/*', () => {
  const fonts = headerFor(netlify, '/fonts/*');
  const astro = headerFor(netlify, '/_astro/*');
  assert.ok(fonts, 'missing [[headers]] for /fonts/*');
  assert.ok(astro, 'missing [[headers]] for /_astro/*');
  assert.match(fonts, /Cache-Control\s*=\s*"public, max-age=31536000, immutable"/);
  assert.match(astro, /Cache-Control\s*=\s*"public, max-age=31536000, immutable"/);
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
  const home = await readFile(path.join(dist, 'index.html'), 'utf8');

  assert.match(
    english,
    /<link rel="preload" href="\/fonts\/literata-latin-400-v3\.103\.woff2" as="font" type="font\/woff2" crossorigin/,
  );
  assert.match(bangla, /href="\/fonts\/literata-latin-400-v3\.103\.woff2"/);
  assert.doesNotMatch(english, /preload[^>]+noto-serif-bengali/i);
  assert.doesNotMatch(english, /preload[^>]+hind-siliguri/i);
  assert.doesNotMatch(list, /rel="preload"[^>]+as="font"/);
  assert.doesNotMatch(home, /rel="preload"[^>]+as="font"/);

  assert.match(english, /<article class="blog-post[^"]*" lang="en">/);
  assert.match(bangla, /<article class="blog-post[^"]*" lang="bn">/);

  const distCssFiles = (await walk(path.join(dist, '_astro'))).filter((file) =>
    file.endsWith('.css'),
  );
  let faces = [];
  for (const file of distCssFiles) {
    faces = faces.concat(fontFaceBlocks(await readFile(file, 'utf8')));
  }
  assert.ok(faces.length >= 7, `expected @font-face in dist CSS, got ${faces.length}`);
  for (const face of faces) {
    for (const url of urlsIn(face)) {
      assert.doesNotMatch(url, /^https?:\/\//i, url);
      assert.doesNotMatch(url, GOOGLE_FONT_HOSTS, url);
    }
  }

  assert.equal(await exists(path.join(dist, 'fonts/literata-latin-400-v3.103.woff2')), true);
  assert.equal(await exists(path.join(dist, 'fonts/noto-serif-bengali-400-v3.000.woff2')), true);
  assert.equal(await exists(path.join(dist, 'fonts/hind-siliguri-400-v1.001.woff2')), true);
});

test('built output never references fonts.googleapis.com or fonts.gstatic.com', async (t) => {
  const dist = path.join(root, 'dist');
  if (!(await exists(dist))) {
    t.skip('dist/ not built yet');
    return;
  }
  const hits = [];
  for (const file of await walk(dist)) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
    const text = await readFile(file, 'utf8');
    if (GOOGLE_FONT_HOSTS.test(text)) hits.push(path.relative(dist, file));
  }
  assert.deepEqual(hits, []);
});
